"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  notifyClientPreviewReady,
  notifyClientPublished,
} from "@/lib/notifications";

const ALLOWED_STATUSES = new Set([
  "new",
  "ai_generated",
  "in_review",
  "client_review",
  "done",
]);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

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
  const { data: task, error } = await supabase
    .from("work_tasks")
    .update(updates)
    .eq("id", taskId)
    .select("page_id")
    .maybeSingle();
  if (error) return { error: error.message };

  // client_review 로 전환 시 사장님에게 미리보기 알림 발송.
  if (status === "client_review" && task?.page_id) {
    try {
      const { data: page } = await supabase
        .from("pages")
        .select("id, slug, client_id")
        .eq("id", task.page_id)
        .maybeSingle();
      if (page) {
        const { data: client } = await supabase
          .from("clients")
          .select("phone, business_name")
          .eq("id", page.client_id)
          .maybeSingle();
        if (client) {
          await notifyClientPreviewReady({
            clientPhone: client.phone,
            businessName: client.business_name ?? page.slug,
            previewUrl: `${BASE_URL}/me/pages/${page.id}/preview`,
          });
        }
      }
    } catch (err) {
      console.warn("[notify] client_review 알림 실패:", err);
    }
  }

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
  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .update({ status: "published", published_at: now })
    .eq("id", pageId)
    .select("id, slug, client_id")
    .maybeSingle();
  if (pageErr || !page) return { error: pageErr?.message ?? "페이지가 없습니다" };
  await supabase
    .from("work_tasks")
    .update({ status: "done", completed_at: now })
    .eq("page_id", pageId);

  // 사장님에게 발행 완료 알림.
  try {
    const { data: client } = await supabase
      .from("clients")
      .select("phone, business_name")
      .eq("id", page.client_id)
      .maybeSingle();
    if (client) {
      await notifyClientPublished({
        clientPhone: client.phone,
        businessName: client.business_name ?? page.slug,
        pageUrl: `${BASE_URL}/p/${page.slug}`,
        editUrl: `${BASE_URL}/me/pages/${page.id}/edit`,
      });
    }
  } catch (err) {
    console.warn("[notify] publish 알림 실패:", err);
  }

  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/admin/tasks");
  redirect(`/admin/tasks/${taskId}`);
}
