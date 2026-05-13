import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

interface Body {
  order?: Array<{ id: string; sortOrder: number }>;
}

/**
 * PATCH /api/v1/admin/pages/:id/blocks/order — 블록 순서 일괄 변경.
 * reference: docs/focusme-api-spec.md §4.8
 */
export async function PATCH(request: Request, { params }: Params) {
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

  if (!Array.isArray(body.order) || body.order.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "order 배열이 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();

  // 페이지 존재 확인
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }

  // 일괄 update — 트랜잭션이 없으므로 개별 update 후 실패 시 부분 반영 가능.
  // MVP 단순화: 모든 row 순회.
  const failures: string[] = [];
  for (const item of body.order) {
    const { error } = await supabase
      .from("blocks")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id)
      .eq("page_id", pageId);
    if (error) failures.push(item.id);
  }

  if (failures.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "일부 블록 순서 변경 실패",
          details: { failed: failures },
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { success: true } });
}
