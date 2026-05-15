import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * v2 A5: 카드 상세 페이지(4단계 pipeline UI)는 제거.
 * 이 라우트는 status 별 적절한 화면으로 redirect 만 처리 — 기존 즐겨찾기·외부 링크 보호용.
 *
 * 흐름:
 *   - published → /edit
 *   - work_tasks.client_review → /preview
 *   - 그 외 (draft) → /submit
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §6.2 + §11 A5
 */
export default async function MyPageDetailPage({ params }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, status, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();
  if (page.client_id !== session.sub) redirect("/me");

  if (page.status === "published") {
    redirect(`/me/pages/${id}/edit`);
  }

  const { data: task } = await supabase
    .from("work_tasks")
    .select("status")
    .eq("page_id", id)
    .maybeSingle();

  if (task?.status === "client_review") {
    redirect(`/me/pages/${id}/preview`);
  }

  redirect(`/me/pages/${id}/submit`);
}
