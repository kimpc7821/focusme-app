"use client";

import { useState, useTransition } from "react";

interface Props {
  pageId: string;
  field: "tagline" | "story";
  currentValue: string;
  onPick: (value: string) => void;
  label?: string;
}

/**
 * v2 §7: AI 보강 버튼 — 1회 호출 후 3개 제안 표시 → 사장님이 픽 또는 무시.
 * 페이지·필드별 5분 1회 rate limit (서버에서 처리).
 */
export function AiSuggestButton({
  pageId,
  field,
  currentValue,
  onPick,
  label = "AI 추천 받기",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!currentValue.trim()) {
      setError("먼저 키워드를 한 줄 적어주세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/v1/me/pages/${pageId}/ai/suggest`,
          {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ field, input: currentValue }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `요청 실패 (HTTP ${res.status})`);
          return;
        }
        setSuggestions(json?.data?.suggestions ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handlePick = (text: string) => {
    onPick(text);
    setSuggestions(null);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="px-3 py-1.5 rounded-md border border-border-default text-fg-secondary text-[11px] hover:bg-bg-soft disabled:opacity-50"
      >
        {pending ? "추천 중..." : label}
      </button>
      {error && (
        <p className="mt-1 text-[10px] text-danger">{error}</p>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="text-[10px] text-fg-tertiary">
            마음에 드는 표현을 골라주세요. (한 번만 가능)
          </p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePick(s)}
              className="w-full text-left px-3 py-2 text-[12px] rounded-md border border-border-default bg-bg hover:border-info hover:bg-info-soft"
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSuggestions(null)}
            className="text-[10px] text-fg-tertiary hover:underline"
          >
            추천 닫기
          </button>
        </div>
      )}
    </div>
  );
}
