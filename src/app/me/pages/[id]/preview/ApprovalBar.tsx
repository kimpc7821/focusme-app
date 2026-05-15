"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  pageId: string;
  alreadyApproved: boolean;
}

type Mode = "idle" | "request" | "done";

/**
 * /preview 의 하단 sticky 액션 바.
 *
 * "이대로 발행" → POST /approve → 직원 알림 → /me redirect
 * "수정 요청" → 텍스트 모달 → POST /request-changes → 직원 알림
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §2 [5] + §13.1 시나리오 1
 */
export function ApprovalBar({ pageId, alreadyApproved }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>(alreadyApproved ? "done" : "idle");
  const [requestNote, setRequestNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApprove = () => {
    if (!confirm("이대로 발행을 요청하시겠어요?")) return;
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}/approve`, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `요청 실패 (HTTP ${res.status})`);
          return;
        }
        setMode("done");
        setSuccessMsg(
          "발행 요청 보냈어요. 직원이 곧 발행하고 알림톡으로 알려드릴게요.",
        );
        setTimeout(() => router.push("/me"), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleSubmitChange = () => {
    if (requestNote.trim().length < 3) {
      setError("어떤 수정이 필요한지 적어주세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/v1/me/pages/${pageId}/request-changes`,
          {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ description: requestNote.trim() }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `요청 실패 (HTTP ${res.status})`);
          return;
        }
        setMode("idle");
        setRequestNote("");
        setSuccessMsg(
          "수정 요청 보냈어요. 직원이 확인 후 카카오톡으로 답변드릴게요.",
        );
        setTimeout(() => router.push("/me"), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border-default shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <div className="max-w-[480px] mx-auto px-5 py-4">
        {successMsg && (
          <p className="mb-2 text-[12px] text-success bg-success-soft px-3 py-2 rounded">
            {successMsg}
          </p>
        )}
        {error && (
          <p className="mb-2 text-[12px] text-danger bg-danger-soft px-3 py-2 rounded">
            {error}
          </p>
        )}

        {mode === "done" ? (
          <p className="text-center text-[12px] text-fg-secondary py-2">
            발행 요청 보냄. 직원이 처리 중입니다.
          </p>
        ) : mode === "request" ? (
          <div className="space-y-2">
            <p className="text-[12px] text-fg-secondary">
              어떤 수정이 필요한지 알려주세요
            </p>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="예: 메인 사진을 좀 더 밝은 분위기로 바꿔주세요"
              rows={3}
              className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("idle");
                  setError(null);
                }}
                className="px-3 py-2 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitChange}
                disabled={pending}
                className="flex-1 px-4 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "전송 중..." : "수정 요청 보내기"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("request")}
              disabled={pending}
              className="px-4 py-2.5 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft disabled:opacity-50"
            >
              수정 요청
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={pending}
              className="flex-1 px-4 py-2.5 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "처리 중..." : "이대로 발행"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
