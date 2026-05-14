import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { uploadToR2 } from "@/lib/storage/r2";

interface Params {
  params: Promise<{ id: string }>;
}

const ALLOWED_CATEGORIES = new Set([
  "logo",
  "main_image",
  "product_image",
  "lifestyle",
  "text",
  "other",
]);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
]);

const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "video/mp4") return "mp4";
  return "bin";
}

/**
 * POST /api/v1/me/pages/:id/assets — 사장님이 직접 자료 업로드.
 * admin POST 와 동일한 R2 업로드 + DB 기록. 소유권 검사 추가.
 * reference: docs/focusme-api-spec.md §3.5
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "multipart 파싱 실패" } },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const category = String(form.get("category") ?? "");
  const blockIdRaw = form.get("blockId");
  const blockId = blockIdRaw ? String(blockIdRaw) : null;

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "file 필드가 필요합니다" } },
      { status: 400 },
    );
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "허용되지 않은 category" } },
      { status: 400 },
    );
  }

  const contentType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(contentType)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `허용되지 않은 MIME 타입: ${contentType}`,
        },
      },
      { status: 400 },
    );
  }

  const isVideo = contentType.startsWith("video/");
  const maxSize = isVideo ? VIDEO_MAX : IMAGE_MAX;
  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `파일 용량 초과 (${isVideo ? "동영상 50MB" : "이미지 10MB"})`,
        },
      },
      { status: 400 },
    );
  }

  const ext = extFromMime(contentType);
  const key = `pages/${pageId}/${category}/${randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  let publicUrl: string;
  try {
    const result = await uploadToR2({ key, body: buffer, contentType });
    publicUrl = result.publicUrl;
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "R2 업로드 실패: " +
            (err instanceof Error ? err.message : String(err)),
        },
      },
      { status: 500 },
    );
  }

  const supabase = createServerSupabase();
  const fileName =
    file instanceof File ? file.name : key.split("/").pop() ?? key;
  const { data: asset, error } = await supabase
    .from("assets")
    .insert({
      page_id: pageId,
      block_id: blockId,
      category,
      url: publicUrl,
      meta: { fileName, size: file.size, contentType },
    })
    .select()
    .single();
  if (error || !asset) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message ?? "DB 기록 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { asset } }, { status: 201 });
}
