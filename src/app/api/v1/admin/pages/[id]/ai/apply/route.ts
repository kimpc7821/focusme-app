import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

interface Body {
  blockId?: string;
  content?: Record<string, unknown>;
}

/**
 * POST /api/v1/admin/pages/:id/ai/apply
 * regenerate 결과의 after content 를 클라이언트가 그대로 보내 채택.
 * (서버 측 임시 저장소 없음 — 클라이언트가 결과를 들고 있다가 채택 시 함께 전송)
 * reference: docs/focusme-api-spec.md §4.10
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body.blockId || !body.content || typeof body.content !== "object") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "blockId 와 content 가 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("blocks")
    .update({ content: body.content })
    .eq("id", body.blockId)
    .eq("page_id", pageId)
    .select()
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: error?.message ?? "블록이 없습니다",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}
