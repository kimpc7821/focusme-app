"use client";

import { useActionState } from "react";
import {
  updatePaymentAction,
  type PaymentState,
} from "@/app/admin/_actions/clients";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "결제 대기" },
  { value: "invoiced", label: "계산서 발행" },
  { value: "paid", label: "결제 완료" },
  { value: "refunded", label: "환불" },
  { value: "cancelled", label: "취소" },
];

const initial: PaymentState = {};

export function PaymentForm({
  id,
  paymentStatus,
  paymentAmount,
  invoiceNumber,
  invoicedAt,
  paidAt,
}: {
  id: string;
  paymentStatus: string;
  paymentAmount: number | null;
  invoiceNumber: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
}) {
  const [state, action, pending] = useActionState(updatePaymentAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="block text-[10px] text-fg-secondary mb-1">상태</span>
        <select
          name="paymentStatus"
          defaultValue={paymentStatus}
          className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] text-fg-secondary mb-1">
          금액 (원)
        </span>
        <input
          name="amount"
          type="number"
          min={0}
          step={10000}
          defaultValue={paymentAmount ?? 220000}
          className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg"
        />
      </label>
      <label className="block">
        <span className="block text-[10px] text-fg-secondary mb-1">
          세금계산서 번호
        </span>
        <input
          name="invoiceNumber"
          defaultValue={invoiceNumber ?? ""}
          placeholder="INV-2026-0042"
          className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg font-mono"
        />
      </label>

      <div className="text-[10px] text-fg-tertiary border-t border-border-default pt-2 space-y-0.5">
        <div>계산서 발행: {formatDate(invoicedAt)}</div>
        <div>결제 완료: {formatDate(paidAt)}</div>
      </div>

      {state.error && (
        <p className="text-[11px] text-danger">⚠ {state.error}</p>
      )}
      {state.success && (
        <p className="text-[11px] text-success">✓ {state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-3 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "결제 정보 저장"}
      </button>
    </form>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
