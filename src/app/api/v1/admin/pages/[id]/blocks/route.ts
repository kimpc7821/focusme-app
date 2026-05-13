import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

interface Body {
  blockType?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  isSystem?: boolean;
  config?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

/**
 * POST /api/v1/admin/pages/:id/blocks — 블록 추가.
 * reference: docs/focusme-api-spec.md §4.5
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body.blockType) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "blockType 이 필요합니다",
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
    .eq("id", id)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }

  // blockType 검증 (lookup)
  const { data: blockMeta } = await supabase
    .from("lookup_block_types")
    .select("key")
    .eq("key", body.blockType)
    .maybeSingle();
  if (!blockMeta) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "허용되지 않은 blockType",
        },
      },
      { status: 400 },
    );
  }

  // sortOrder 자동 (없으면 max + 1)
  let sortOrder = body.sortOrder;
  if (typeof sortOrder !== "number") {
    const { data: maxRow } = await supabase
      .from("blocks")
      .select("sort_order")
      .eq("page_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxRow?.sort_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("blocks")
    .insert({
      page_id: id,
      block_type: body.blockType,
      sort_order: sortOrder,
      is_enabled: body.isEnabled ?? true,
      is_system: body.isSystem ?? false,
      config: body.config ?? {},
      content: body.content ?? {},
    })
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message ?? "블록 생성 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
