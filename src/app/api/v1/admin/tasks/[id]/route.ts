import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/tasks/:id
 * task + page (with blocks · assets) + client + materialChecklist.
 * reference: docs/focusme-api-spec.md §4.3
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: task, error } = await supabase
    .from("work_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !task) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "작업이 없습니다" } },
      { status: 404 },
    );
  }

  const [{ data: page }, { data: blocks }, { data: assets }] = await Promise.all([
    supabase.from("pages").select("*").eq("id", task.page_id).maybeSingle(),
    supabase
      .from("blocks")
      .select("*")
      .eq("page_id", task.page_id)
      .order("sort_order", { ascending: true }),
    supabase.from("assets").select("*").eq("page_id", task.page_id),
  ]);

  const client = page
    ? (
        await supabase
          .from("clients")
          .select("*")
          .eq("id", page.client_id)
          .maybeSingle()
      ).data
    : null;

  // materialChecklist — assets 카테고리별 집계
  const categories = ["logo", "main_image", "product_image", "lifestyle", "text"];
  const checklist = categories.map((category) => {
    const matches = (assets ?? []).filter((a) => a.category === category);
    return {
      category,
      status: matches.length > 0 ? "complete" : "missing",
      count: matches.length,
    };
  });

  return NextResponse.json({
    data: {
      task,
      page,
      blocks: blocks ?? [],
      assets: assets ?? [],
      client,
      materialChecklist: checklist,
    },
  });
}

/**
 * PATCH /api/v1/admin/tasks/:id — 상태·담당자 변경.
 * reference: docs/focusme-api-spec.md §4.4
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  let body: { status?: string; assigneeId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const allowedStatuses = [
    "new",
    "ai_generated",
    "in_review",
    "client_review",
    "done",
  ];
  const updates: Partial<{
    status: string;
    assignee_id: string | null;
    ai_generated_at: string;
    reviewed_at: string;
    preview_sent_at: string;
    completed_at: string;
  }> = {};
  if (body.status !== undefined) {
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "허용되지 않는 status 입니다",
          },
        },
        { status: 400 },
      );
    }
    updates.status = body.status;
    if (body.status === "ai_generated")
      updates.ai_generated_at = new Date().toISOString();
    if (body.status === "in_review")
      updates.reviewed_at = new Date().toISOString();
    if (body.status === "client_review")
      updates.preview_sent_at = new Date().toISOString();
    if (body.status === "done")
      updates.completed_at = new Date().toISOString();
  }
  if (body.assigneeId !== undefined) {
    updates.assignee_id = body.assigneeId;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "변경할 필드 없음" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("work_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: error?.message ?? "작업이 없습니다",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}
