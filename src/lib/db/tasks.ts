import { createServerSupabase } from "@/lib/supabase/server";

export interface TaskListRow {
  id: string;
  status: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  page_slug: string;
  page_status: string;
  template_type: string;
  tone_key: string | null;
  business_name: string;
  business_type: string;
}

export async function listTasksForAdmin(args: {
  status?: string[];
  page: number;
  limit: number;
}): Promise<{ rows: TaskListRow[]; total: number }> {
  const supabase = createServerSupabase();
  const from = (args.page - 1) * args.limit;
  const to = from + args.limit - 1;

  let query = supabase
    .from("work_tasks")
    .select(
      "id, status, assignee_id, created_at, updated_at, pages!inner(slug, status, template_type, tone_key, clients!inner(business_name, business_type))",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (args.status && args.status.length > 0) {
    query = query.in("status", args.status);
  }

  const { data, count } = await query;
  type RawRow = {
    id: string;
    status: string;
    assignee_id: string | null;
    created_at: string;
    updated_at: string;
    pages: {
      slug: string;
      status: string;
      template_type: string;
      tone_key: string | null;
      clients: { business_name: string; business_type: string };
    };
  };
  const rows = ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    status: row.status,
    assignee_id: row.assignee_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    page_slug: row.pages.slug,
    page_status: row.pages.status,
    template_type: row.pages.template_type,
    tone_key: row.pages.tone_key,
    business_name: row.pages.clients.business_name,
    business_type: row.pages.clients.business_type,
  }));

  return { rows, total: count ?? 0 };
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  new: "신규",
  ai_generated: "AI 생성",
  in_review: "검수 중",
  client_review: "클라이언트 확인",
  done: "완료",
};

export const TASK_STATUS_BADGE: Record<string, string> = {
  new: "bg-info-soft text-info",
  ai_generated: "bg-ai-soft text-ai-text-token",
  in_review: "bg-warning-soft text-warning",
  client_review: "bg-info-soft text-info",
  done: "bg-success-soft text-success",
};
