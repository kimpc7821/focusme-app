"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

const VALID_STATUS = new Set(["new", "contacted", "closed"]);

export interface InquiryUpdateState {
  error?: string;
  success?: string;
}

export async function updateInquiryStatusAction(
  _prev: InquiryUpdateState,
  formData: FormData,
): Promise<InquiryUpdateState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!id) return { error: "id 가 없습니다" };
  if (!VALID_STATUS.has(status)) return { error: "유효하지 않은 status" };

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("inquiries")
    .update({
      status,
      handled_at: status === "new" ? null : new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/inquiries");
  return { success: "저장됨" };
}
