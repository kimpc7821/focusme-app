"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RegenResult {
  blockId: string;
  before: { content: Record<string, unknown> };
  after: { content: Record<string, unknown> };
  tokensUsed: { input: number; output: number };
  costKrw: number;
}

interface Props {
  pageId: string;
  blockId: string;
  blockType: string;
  onClose: () => void;
}

export function AiRegenerateModal({
  pageId,
  blockId,
  blockType,
  onClose,
}: Props) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [keepFacts, setKeepFacts] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "generating" | "result" | "applying"
  >("idle");
  const [result, setResult] = useState<RegenResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setStatus("generating");
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/pages/${pageId}/ai/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetBlockIds: [blockId],
            instruction,
            keepFacts,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "AI 호출 실패");
        setStatus("idle");
        return;
      }
      const first = data?.data?.results?.[0];
      if (!first) {
        setError("AI 결과가 비어있습니다");
        setStatus("idle");
        return;
      }
      setResult({
        blockId: first.blockId,
        before: first.before,
        after: first.after,
        tokensUsed: data.data.tokensUsed,
        costKrw: data.data.costKrw,
      });
      setStatus("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    }
  };

  const apply = async () => {
    if (!result) return;
    setStatus("applying");
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/pages/${pageId}/ai/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          content: result.after.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "채택 실패");
        setStatus("result");
        return;
      }
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("result");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={status === "generating" || status === "applying" ? undefined : onClose}
    >
      <div
        className="bg-bg rounded-lg shadow-modal w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
          <div>
            <h3 className="text-[14px] font-medium text-fg flex items-center gap-2">
              <span className="text-[var(--color-ai-text)]">✦</span>
              AI 재생성
            </h3>
            <p className="text-[11px] text-fg-tertiary">{blockType}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "generating" || status === "applying"}
            className="text-fg-tertiary hover:text-fg text-[18px] disabled:opacity-30"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {status === "idle" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-fg-secondary mb-1">
                  지시사항 (선택)
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={4}
                  placeholder={`예시 — "더 감성적인 톤으로 다시", "가족 이야기 강조", "더 짧게", "사장님 1인칭으로"`}
                  className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg resize-y leading-relaxed"
                />
                <p className="mt-1 text-[10px] text-fg-tertiary">
                  비워두면 톤 가이드에 따라 자연스럽게 다듬습니다.
                </p>
              </div>
              <label className="flex items-start gap-2 text-[12px] text-fg cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepFacts}
                  onChange={(e) => setKeepFacts(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">사실 보존</span>
                  <span className="block text-[10px] text-fg-tertiary mt-0.5">
                    상품명·가격·연락처·주소·영업시간 등은 변경 안 함
                  </span>
                </span>
              </label>
              {error && (
                <p className="text-[11px] text-danger">⚠ {error}</p>
              )}
            </div>
          )}

          {(status === "generating" || status === "applying") && (
            <div className="flex flex-col items-center justify-center py-12 text-fg-secondary">
              <div className="w-8 h-8 border-2 border-border-default border-t-[var(--color-ai-strong)] rounded-full animate-spin" />
              <p className="mt-3 text-[12px]">
                {status === "generating"
                  ? "Claude 호출 중..."
                  : "채택 중..."}
              </p>
            </div>
          )}

          {status === "result" && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] text-fg-tertiary">
                <span>
                  토큰: in {result.tokensUsed.input} · out{" "}
                  {result.tokensUsed.output}
                </span>
                <span>비용: ~{result.costKrw}원</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-fg-tertiary font-medium mb-1">
                    Before
                  </p>
                  <pre className="p-3 text-[11px] font-mono rounded-md bg-bg-soft text-fg-secondary leading-relaxed whitespace-pre-wrap break-words max-h-80 overflow-auto">
                    {JSON.stringify(result.before.content, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-ai-text)] font-medium mb-1">
                    After (AI)
                  </p>
                  <pre
                    className="p-3 text-[11px] font-mono rounded-md text-fg leading-relaxed whitespace-pre-wrap break-words max-h-80 overflow-auto border"
                    style={{
                      background: "var(--color-ai-bg)",
                      borderColor: "var(--color-ai-border)",
                    }}
                  >
                    {JSON.stringify(result.after.content, null, 2)}
                  </pre>
                </div>
              </div>
              {error && (
                <p className="text-[11px] text-danger">⚠ {error}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border-default">
          <button
            type="button"
            onClick={onClose}
            disabled={status === "generating" || status === "applying"}
            className="px-3 py-1.5 rounded text-[12px] text-fg-secondary hover:bg-bg-soft disabled:opacity-50"
          >
            취소
          </button>
          {status === "idle" && (
            <button
              type="button"
              onClick={generate}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium hover:opacity-90"
              style={{
                background: "var(--color-ai-strong)",
                color: "white",
              }}
            >
              ✦ AI 재생성
            </button>
          )}
          {status === "result" && result && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setStatus("idle");
                }}
                className="px-3 py-1.5 rounded text-[12px] text-fg hover:bg-bg-soft"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={apply}
                className="px-4 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90"
              >
                이대로 채택
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
