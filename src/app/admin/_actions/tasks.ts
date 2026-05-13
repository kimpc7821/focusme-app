"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set([
  "new",
  "ai_generated",
  "in_review",
  "client_review",
  "done",
]);

export async function updateTaskStatusAction(
  taskId: string,
  status: string,
): Promise<{ error?: string }> {
  if (!ALLOWED_STATUSES.has(status)) {
    return { error: "허용되지 않은 상태입니다" };
  }
  const updates: Partial<{
    status: string;
    ai_generated_at: string;
    reviewed_at: string;
    preview_sent_at: string;
    completed_at: string;
  }> = { status };
  const now = new Date().toISOString();
  if (status === "ai_generated") updates.ai_generated_at = now;
  if (status === "in_review") updates.reviewed_at = now;
  if (status === "client_review") updates.preview_sent_at = now;
  if (status === "done") updates.completed_at = now;

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("work_tasks")
    .update(updates)
    .eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  return {};
}

export async function publishPageAction(
  taskId: string,
  pageId: string,
): Promise<{ error?: string }> {
  const supabase = createServerSupabase();
  const now = new Date().toISOString();
  const { error: pageErr } = await supabase
    .from("pages")
    .update({ status: "published", published_at: now })
    .eq("id", pageId);
  if (pageErr) return { error: pageErr.message };
  await supabase
    .from("work_tasks")
    .update({ status: "done", completed_at: now })
    .eq("page_id", pageId);
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  redirect(`/admin/tasks/${taskId}`);
}
