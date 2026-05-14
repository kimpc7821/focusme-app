"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyClientChangeRequestUpdate } from "@/lib/notifications/stub";

const VALID_STATUS = new Set([
  "pending",
  "quoted",
  "in_progress",
  "completed",
  "rejected",
]);

export interface UpdateState {
  error?: string;
  success?: string;
}

export async function updateChangeRequestAction(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const quotedCostRaw = String(formData.get("quotedCost") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!id) return { error: "id 가 없습니다" };
  if (status && !VALID_STATUS.has(status))
    return { error: "유효하지 않은 status" };

  const updates: {
    status?: string;
    quoted_cost?: number | null;
    quoted_at?: string | null;
    completed_at?: string | null;
    notes?: string | null;
  } = {};

  if (status) {
    updates.status = status;
    if (status === "quoted") updates.quoted_at = new Date().toISOString();
    if (status === "completed")
      updates.completed_at = new Date().toISOString();
  }
  if (quotedCostRaw !== "") {
    const n = Number(quotedCostRaw);
    if (Number.isNaN(n) || n < 0) return { error: "견적 금액 형식 오류" };
    updates.quoted_cost = n;
  }
  if (note !== null) updates.notes = note;

  if (Object.keys(updates).length === 0) {
    return { error: "변경할 항목이 없습니다" };
  }

  const supabase = createServerSupabase();
  const { data: cr, error } = await supabase
    .from("change_requests")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !cr) {
    return { error: error?.message ?? "요청을 찾을 수 없습니다" };
  }

  if (status) {
    const { data: page } = await supabase
      .from("pages")
      .select("slug, client_id")
      .eq("id", cr.page_id)
      .maybeSingle();
    let clientPhone: string | null = null;
    if (page?.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("phone")
        .eq("id", page.client_id)
        .maybeSingle();
      clientPhone = client?.phone ?? null;
    }
    await notifyClientChangeRequestUpdate({
      clientPhone,
      pageSlug: page?.slug ?? "?",
      status,
      quotedCost: cr.quoted_cost,
      note: cr.notes,
    });
  }

  revalidatePath("/admin/change-requests");
  return { success: "저장됨" };
}
