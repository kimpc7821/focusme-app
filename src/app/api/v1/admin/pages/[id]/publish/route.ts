import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/pages/:id/publish
 * pages.status → published, published_at = NOW.
 * work_tasks.status → done.
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
  return NextResponse.json({
    data: {
      page,
      url: `${baseUrl}/p/${page.slug}`,
    },
  });
}
