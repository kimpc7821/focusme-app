"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface ChangeRequest {
  id: string;
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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "접수됨",
    cls: "bg-bg-soft text-fg-secondary border border-border-default",
  },
  quoted: { label: "견적 도착", cls: "bg-info-soft text-info" },
  in_progress: { label: "진행 중", cls: "bg-ai-soft text-ai-text-token" },
  completed: { label: "완료", cls: "bg-success-soft text-success" },
  rejected: { label: "반려", cls: "bg-danger-soft text-danger" },
};

export function ChangeRequestPanel({
  pageId,
  initialRequests,
}: {
  pageId: string;
  initialRequests: ChangeRequest[];
}) {
  const [requests, setRequests] = useState<ChangeRequest[]>(initialRequests);
  const [requestType, setRequestType] = useState("block_add");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    const desc = description.trim();
    if (!desc) {
      setErr("변경하고 싶은 내용을 자세히 적어주세요");
      return;
    }
    setErr(null);
    setSavedMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}/change-requests`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ requestType, description: desc }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErr(json?.error?.message ?? `제출 실패 (HTTP ${res.status})`);
          return;
        }
        setRequests((prev) => [json.data.changeRequest, ...prev]);
        setDescription("");
        setSavedMsg(
          "의뢰가 접수됐습니다. 검토 후 카톡으로 답변드릴게요.",
        );
        router.refresh();
      } catch (e) {
        setErr("제출 실패: " + (e instanceof Error ? e.message : String(e)));
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="bg-bg rounded-lg border border-border-default p-5">
        <h3 className="text-[13px] font-medium text-fg mb-1">
          큰 변경이 필요하면 의뢰해주세요
        </h3>
        <p className="text-[11px] text-fg-tertiary mb-3">
          블록 추가·제거·디자인 변경 등은 검토 후 별도 견적(5~10만원)으로
          진행됩니다.
        </p>

        <div className="space-y-2">
          <label className="block">
            <span className="block text-[10px] text-fg-secondary mb-1">
              변경 유형
            </span>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 text-[12px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] text-fg-secondary mb-1">
              자세한 내용
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="예: FAQ 블록 추가하고 싶어요. 자주 묻는 질문 5개 정도..."
              className="w-full px-3 py-2 text-[12px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
            />
          </label>
        </div>

        {err && (
          <p className="mt-2 text-[11px] text-danger">{err}</p>
        )}
        {savedMsg && (
          <p className="mt-2 text-[11px] text-success">{savedMsg}</p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="mt-3 px-4 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "제출 중..." : "의뢰 보내기"}
        </button>
      </section>

      {requests.length > 0 && (
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
            내가 보낸 의뢰 ({requests.length})
          </h3>
          <ul className="space-y-2">
            {requests.map((r) => {
              const badge = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
              return (
                <li
                  key={r.id}
                  className="bg-bg rounded-lg border border-border-default p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium text-fg">
                        {TYPE_LABEL[r.request_type] ?? r.request_type}
                      </span>
                      <span className="ml-2 text-[10px] text-fg-tertiary">
                        {formatDate(r.submitted_at)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-fg-secondary whitespace-pre-wrap">
                    {r.description}
                  </p>
                  {r.quoted_cost != null && (
                    <p className="mt-2 text-[11px] text-info">
                      견적: {r.quoted_cost.toLocaleString()}원
                    </p>
                  )}
                  {r.notes && (
                    <p className="mt-1 text-[11px] text-fg-tertiary whitespace-pre-wrap border-t border-border-default pt-2 mt-2">
                      직원 메모: {r.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
