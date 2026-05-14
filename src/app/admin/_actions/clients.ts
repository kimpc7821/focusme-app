"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

const VALID_STATUS = new Set([
  "pending",
  "invoiced",
  "paid",
  "refunded",
  "cancelled",
]);

export interface PaymentState {
  error?: string;
  success?: string;
}

export async function updatePaymentAction(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const id = String(formData.get("id") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const invoiceNumber =
    String(formData.get("invoiceNumber") ?? "").trim() || null;

  if (!id) return { error: "id 가 없습니다" };
  if (paymentStatus && !VALID_STATUS.has(paymentStatus)) {
    return { error: "유효하지 않은 paymentStatus" };
  }

  const updates: {
    payment_status?: string;
    payment_amount?: number | null;
    invoice_number?: string | null;
    invoiced_at?: string | null;
    paid_at?: string | null;
  } = {};
  if (paymentStatus) {
    updates.payment_status = paymentStatus;
    if (paymentStatus === "invoiced") {
      updates.invoiced_at = new Date().toISOString();
    }
    if (paymentStatus === "paid") {
      updates.paid_at = new Date().toISOString();
    }
  }
  if (amountRaw !== "") {
    const n = Number(amountRaw);
    if (Number.isNaN(n) || n < 0) return { error: "금액 형식 오류" };
    updates.payment_amount = n;
  }
  if (invoiceNumber !== null) updates.invoice_number = invoiceNumber;

  if (Object.keys(updates).length === 0) {
    return { error: "변경할 필드 없음" };
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${id}`);
  revalidatePath(`/admin/clients`);
  return { success: "저장됨" };
}
