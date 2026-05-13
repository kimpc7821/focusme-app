import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string; blockId: string }>;
}

interface PatchBody {
  config?: Record<string, unknown>;
  content?: Record<string, unknown>;
  isEnabled?: boolean;
  isSystem?: boolean;
  sortOrder?: number;
}

/**
 * PATCH /api/v1/admin/pages/:id/blocks/:blockId — partial update.
 * reference: docs/focusme-api-spec.md §4.6
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id, blockId } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const updates: Partial<{
    config: Record<string, unknown>;
    content: Record<string, unknown>;
    is_enabled: boolean;
    is_system: boolean;
    sort_order: number;
  }> = {};
  if (body.config !== undefined) updates.config = body.config;
  if (body.content !== undefined) updates.content = body.content;
  if (body.isEnabled !== undefined) updates.is_enabled = body.isEnabled;
  if (body.isSystem !== undefined) updates.is_system = body.isSystem;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "변경할 필드 없음" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("blocks")
    .update(updates)
    .eq("id", blockId)
    .eq("page_id", id)
    .select()
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "블록이 없습니다" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/v1/admin/pages/:id/blocks/:blockId
 * reference: docs/focusme-api-spec.md §4.7
 * 시스템 블록(is_system=true) 도 admin 은 삭제 가능.
 */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id, blockId } = await params;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", blockId)
    .eq("page_id", id)
    .select()
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "블록이 없습니다" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { success: true } });
}
