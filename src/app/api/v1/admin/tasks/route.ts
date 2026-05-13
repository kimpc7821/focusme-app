import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/v1/admin/tasks
 * Query: status (multi 가능, 콤마구분) · assigneeId · page · limit
 * reference: docs/focusme-api-spec.md §4.2
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const assigneeId = url.searchParams.get("assigneeId");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 20)),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createServerSupabase();
  let query = supabase
    .from("work_tasks")
    .select(
      "id, status, assignee_id, created_at, updated_at, page:pages (id, slug, template_type, status, tone_key), page_client:pages!inner(client:clients(id, business_name, business_type))",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusParam) {
    const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) query = query.in("status", statuses);
  }
  if (assigneeId) query = query.eq("assignee_id", assigneeId);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
}
