import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyClientPreviewReady } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/pages/:id/preview-send
 * - work_tasks.status → client_review
 * - 사장님에게 미리보기 준비 알림톡 (TPL_003_PREVIEW_READY)
 * - 미리보기 URL: 현재는 발행 전 상태에서도 /p/[slug] 가 노출되지는 않으므로,
 *   사장님 인증 후 접근하는 /me/pages/[id] 로 안내. 추후 별도 미리보기 토큰 도입 가능.
 * reference: docs/focusme-api-spec.md §4.11
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const supabase = createServerSupabase();

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, client_id")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, phone, business_name")
    .eq("id", page.client_id)
    .maybeSingle();
  if (!client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "클라이언트가 없습니다" } },
      { status: 404 },
    );
  }

  // work_tasks.status → client_review
  const now = new Date().toISOString();
  await supabase
    .from("work_tasks")
    .update({ status: "client_review", preview_sent_at: now })
    .eq("page_id", pageId);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const previewUrl = `${baseUrl}/me/pages/${page.id}/preview`;

  const notify = await notifyClientPreviewReady({
    clientPhone: client.phone,
    businessName: client.business_name ?? page.slug,
    previewUrl,
  });

  return NextResponse.json({
    data: {
      success: true,
      previewUrl,
      notify,
    },
  });
}
