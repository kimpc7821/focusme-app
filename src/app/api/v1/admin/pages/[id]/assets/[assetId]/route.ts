import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteFromR2, keyFromPublicUrl } from "@/lib/storage/r2";

interface Params {
  params: Promise<{ id: string; assetId: string }>;
}

/**
 * DELETE /api/v1/admin/pages/:id/assets/:assetId
 * R2 객체 + DB row 모두 삭제. R2 실패해도 DB 는 삭제 시도.
 * reference: docs/focusme-api-spec.md §3.6
 */
export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id: pageId, assetId } = await params;

  const supabase = createServerSupabase();
  const { data: asset, error: fetchErr } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("page_id", pageId)
    .maybeSingle();
  if (fetchErr || !asset) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "자료가 없습니다" } },
      { status: 404 },
    );
  }

  // R2 삭제 — 실패해도 DB 는 진행
  const key = keyFromPublicUrl(asset.url);
  if (key) {
    try {
      await deleteFromR2(key);
    } catch {
      // 로그만 — orphan 파일은 추후 cleanup job 으로 정리
    }
  }

  const { error: delErr } = await supabase
    .from("assets")
    .delete()
    .eq("id", assetId);
  if (delErr) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: delErr.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { success: true } });
}
