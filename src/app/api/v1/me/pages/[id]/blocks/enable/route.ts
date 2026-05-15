import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { EMPTY_SCHEMAS } from "@/lib/blocks/empty-schemas";

interface Params {
  params: Promise<{ id: string }>;
}

interface PostBody {
  blockType?: string;
  sortOrder?: number;
}

/**
 * POST /api/v1/me/pages/:id/blocks/enable — Step 0 "추가 가능 블록 켜기".
 *
 * 권한 가드:
 *   1) 본인 페이지 소유
 *   2) blockType 이 페이지의 template.recommended_optional_blocks 에 포함된 항목
 *   3) 동일 blockType 이 이미 존재하지 않음
 *
 * lookup_block_types 의 default_config 로 새 블록 INSERT.
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.1 + §11 A2
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const blockType = body.blockType;
  if (!blockType || typeof blockType !== "string") {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "blockType 필요" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();

  const { data: page } = await supabase
    .from("pages")
    .select("template_type")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지 없음" } },
      { status: 404 },
    );
  }

  const { data: template } = await supabase
    .from("lookup_templates")
    .select("recommended_optional_blocks")
    .eq("key", page.template_type)
    .maybeSingle();

  const optionals = (template?.recommended_optional_blocks ?? []) as Array<{
    blockType: string;
    label?: string;
    sortOrder?: number;
  }>;
  const allowed = optionals.find((o) => o.blockType === blockType);
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "이 블록은 추가 가능 목록에 없습니다.",
        },
      },
      { status: 403 },
    );
  }

  const { data: existing } = await supabase
    .from("blocks")
    .select("id")
    .eq("page_id", pageId)
    .eq("block_type", blockType)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "이미 추가된 블록입니다.",
        },
      },
      { status: 409 },
    );
  }

  const { data: meta } = await supabase
    .from("lookup_block_types")
    .select("default_config, is_system")
    .eq("key", blockType)
    .maybeSingle();
  if (!meta) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "알 수 없는 블록 종류입니다.",
        },
      },
      { status: 400 },
    );
  }

  const sortOrder = body.sortOrder ?? allowed.sortOrder ?? 50;

  // 기본 content — empty-schemas 의 initialContent 사용 (contact_form 등 default fields 보장).
  const initialContent =
    EMPTY_SCHEMAS[blockType]?.initialContent ?? {};

  const { data: inserted, error: insErr } = await supabase
    .from("blocks")
    .insert({
      page_id: pageId,
      block_type: blockType,
      sort_order: sortOrder,
      is_enabled: true,
      is_system: meta.is_system ?? false,
      config: (meta.default_config as Record<string, unknown> | null) ?? {},
      content: initialContent,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: insErr?.message ?? "블록 추가 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: { success: true, blockId: inserted.id, blockType },
  });
}
