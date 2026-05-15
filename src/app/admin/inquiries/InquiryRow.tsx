"use client";

import { useActionState } from "react";
import {
  updateInquiryStatusAction,
  type InquiryUpdateState,
} from "../_actions/inquiries";

interface Inquiry {
  id: string;
  business_name: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  handled_at: string | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  new: { label: "신규", cls: "bg-info-soft text-info" },
  contacted: { label: "연락함", cls: "bg-ai-soft text-ai-text-token" },
  closed: {
    label: "종료",
    cls: "bg-bg-soft text-fg-tertiary border border-border-default",
  },
};

const initial: InquiryUpdateState = {};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [state, action, pending] = useActionState(
    updateInquiryStatusAction,
    initial,
  );
  const badge = STATUS_BADGE[inquiry.status] ?? STATUS_BADGE.new;

  return (
    <li className="bg-bg rounded-lg border border-border-default p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-fg">
              {inquiry.business_name}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-fg-secondary">
            <a
              href={`tel:${inquiry.phone}`}
              className="hover:underline"
            >
              {inquiry.phone}
            </a>
            <span className="mx-2 text-fg-tertiary">·</span>
            <span className="text-fg-tertiary">
              {formatDate(inquiry.created_at)}
            </span>
          </p>
        </div>
        <form action={action} className="flex items-center gap-1.5 shrink-0">
          <input type="hidden" name="id" value={inquiry.id} />
          <select
            name="status"
            defaultValue={inquiry.status}
            className="text-[12px] px-2 py-1.5 rounded border border-border-default bg-bg-soft text-fg"
          >
            <option value="new">신규</option>
            <option value="contacted">연락함</option>
            <option value="closed">종료</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "..." : "저장"}
          </button>
        </form>
      </div>
      <p className="mt-3 text-[13px] text-fg leading-relaxed whitespace-pre-wrap border-t border-border-default pt-3">
        {inquiry.message}
      </p>
      {state.error && (
        <p className="mt-2 text-[11px] text-danger">⚠ {state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-[11px] text-success">{state.success}</p>
      )}
    </li>
  );
}
