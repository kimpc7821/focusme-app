"use client";

import { useActionState, useState } from "react";
import {
  updateChangeRequestAction,
  type UpdateState,
} from "../_actions/change-requests";

interface Request {
  id: string;
  page_id: string;
  request_type: string;
  description: string;
  status: string;
  quoted_cost: number | null;
  notes: string | null;
  submitted_at: string;
  quoted_at: string | null;
  completed_at: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  block_add: "블록 추가",
  block_remove: "블록 제거",
  design_change: "디자인 변경",
  template_change: "템플릿 변경",
  other: "기타",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-bg-soft text-fg-secondary border border-border-default",
  quoted: "bg-info-soft text-info",
  in_progress: "bg-ai-soft text-ai-text-token",
  completed: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "신규 접수",
  quoted: "견적 회신",
  in_progress: "진행 중",
  completed: "완료",
  rejected: "반려",
};

const initial: UpdateState = {};

export function ChangeRequestRow({
  request,
  pageSlug,
  clientName,
}: {
  request: Request;
  pageSlug: string | null;
  clientName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    updateChangeRequestAction,
    initial,
  );

  return (
    <li className="bg-bg rounded-lg border border-border-default p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded ${STATUS_BADGE[request.status] ?? STATUS_BADGE.pending}`}
            >
              {STATUS_LABEL[request.status] ?? request.status}
            </span>
            <span className="text-[12px] font-medium text-fg">
              {TYPE_LABEL[request.request_type] ?? request.request_type}
            </span>
            <span className="text-[11px] text-fg-tertiary">
              · {clientName ?? "(이름 없음)"}
              {pageSlug && ` · /${pageSlug}`}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-fg-secondary whitespace-pre-wrap">
            {request.description}
          </p>
          <p className="mt-1 text-[10px] text-fg-tertiary">
            접수 {formatDate(request.submitted_at)}
            {request.quoted_at && ` · 견적 ${formatDate(request.quoted_at)}`}
            {request.completed_at &&
              ` · 완료 ${formatDate(request.completed_at)}`}
          </p>
          {request.quoted_cost != null && (
            <p className="mt-1 text-[11px] text-info">
              💰 견적: {request.quoted_cost.toLocaleString()}원
            </p>
          )}
          {request.notes && (
            <p className="mt-1 text-[11px] text-fg-tertiary whitespace-pre-wrap">
              메모: {request.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1.5 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft shrink-0"
        >
          {open ? "닫기" : "처리"}
        </button>
      </div>

      {open && (
        <form
          action={action}
          className="mt-3 pt-3 border-t border-border-default space-y-2"
        >
          <input type="hidden" name="id" value={request.id} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block">
              <span className="block text-[10px] text-fg-secondary mb-1">
                상태 변경
              </span>
              <select
                name="status"
                defaultValue=""
                className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg"
              >
                <option value="">— 그대로 —</option>
                <option value="quoted">견적 회신</option>
                <option value="in_progress">진행 중으로</option>
                <option value="completed">완료 처리</option>
                <option value="rejected">반려</option>
                <option value="pending">신규로 되돌리기</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] text-fg-secondary mb-1">
                견적 (원, 선택)
              </span>
              <input
                name="quotedCost"
                type="number"
                min={0}
                step={10000}
                defaultValue={request.quoted_cost ?? ""}
                placeholder="50000"
                className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="block text-[10px] text-fg-secondary mb-1">
                메모
              </span>
              <input
                name="note"
                defaultValue={request.notes ?? ""}
                placeholder="사장님께 안내할 메모"
                className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg"
              />
            </label>
          </div>

          {state.error && (
            <p className="text-[11px] text-danger">⚠ {state.error}</p>
          )}
          {state.success && (
            <p className="text-[11px] text-success">✓ {state.success}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
