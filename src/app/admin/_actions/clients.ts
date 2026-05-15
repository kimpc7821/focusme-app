"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { hashPassword, generateTempPassword } from "@/lib/auth/passwords";

export interface ResetPwState {
  error?: string;
  tempPassword?: string;
}

/**
 * 사장님 임시 비밀번호 재발급 — pw 분실 시 직원이 실행.
 * 새 임시 pw 생성 → hash 저장 → must_change_password=true.
 * 평문은 이 응답으로 1회만 반환 (화면 표시용).
 */
export async function resetClientPasswordAction(
  _prev: ResetPwState,
  formData: FormData,
): Promise<ResetPwState> {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "clientId 가 없습니다" };

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ password_hash: passwordHash, must_change_password: true })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { tempPassword };
}

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
