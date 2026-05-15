import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyClientPublished } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/pages/:id/publish
 * pages.status → published, published_at = NOW.
 * work_tasks.status → done.
 * 사장님에게 발행 완료 알림톡 (NOTIFY_PROVIDER=mock 이면 console.log).
 * reference: docs/focusme-api-spec.md §4.12
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const supabase = createServerSupabase();
  const now = new Date().toISOString();

  const { data: page, error } = await supabase
    .from("pages")
    .update({ status: "published", published_at: now })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error || !page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }

  // 연결된 work_task done
  await supabase
    .from("work_tasks")
    .update({ status: "done", completed_at: now })
    .eq("page_id", page.id);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const pageUrl = `${baseUrl}/p/${page.slug}`;

  // 사장님 알림 — 실패해도 발행 자체 성공으로 응답.
  const { data: client } = await supabase
    .from("clients")
    .select("phone, business_name")
    .eq("id", page.client_id)
    .maybeSingle();
  if (client) {
    await notifyClientPublished({
      clientPhone: client.phone,
      businessName: client.business_name ?? page.slug,
      pageUrl,
      editUrl: `${baseUrl}/me/pages/${page.id}/edit`,
    });
  }

  return NextResponse.json({
    data: { page, url: pageUrl },
  });
}
