"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EssentialInfo } from "@/lib/types";
import type { AssetRef, BlockSummary } from "./SubmitWizard";

const SYSTEM_OR_HIDDEN = new Set([
  "profile_header",
  "location_info",
  "legal_footer",
  "floating_cta",
  "phone_button",
  "kakao_channel",
]);

interface Props {
  pageId: string;
  essentialInfo: EssentialInfo;
  blocks: BlockSummary[];
  assets: AssetRef[];
  blockTypeMeta: Record<
    string,
    { name: string; defaultConfig: unknown; defaultContent: unknown }
  >;
}

/**
 * Step 3 — 진행도 확인 + 제출.
 *
 * 진행도 항목:
 *   - essential_info 핵심 필드 (상호명·전화·주소·영업시간·사업자번호)
 *   - 각 비시스템·비숨김 블록의 content 가 비어있지 않은지
 *   - assets 업로드 여부 (해당 블록 카테고리 매칭)
 *
 * "제출하기" → POST /api/v1/me/pages/:id/submit → work_tasks.new → in_review + 직원 알림
 */
export function Step3Review({
  pageId,
  essentialInfo,
  blocks,
  blockTypeMeta,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const essentialChecks = useMemo(() => {
    const ei = essentialInfo ?? {};
    return [
      { label: "상호명", ok: !!ei.businessName },
      { label: "전화번호", ok: !!ei.phone },
      { label: "주소", ok: !!ei.address?.full },
      {
        label: "영업시간",
        ok: !!(
          ei.hours?.weekdays ||
          ei.hours?.saturday ||
          ei.hours?.sunday
        ),
      },
      { label: "사업자등록번호", ok: !!ei.businessNumber },
    ];
  }, [essentialInfo]);

  const blockChecks = useMemo(() => {
    return blocks
      .filter((b) => b.isEnabled && !SYSTEM_OR_HIDDEN.has(b.blockType))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((b) => ({
        id: b.id,
        label: blockTypeMeta[b.blockType]?.name ?? b.blockType,
        ok: Object.keys(b.content ?? {}).some((k) => {
          const v = (b.content as Record<string, unknown>)[k];
          if (typeof v === "string") return v.trim().length > 0;
          if (Array.isArray(v)) return v.length > 0;
          return false;
        }),
      }));
  }, [blocks, blockTypeMeta]);

  const requiredOk = essentialChecks.every((c) => c.ok);

  const handleSubmit = () => {
    if (!requiredOk) {
      setError("필수 정보가 부족합니다. 위 항목을 채워주세요.");
      return;
    }
    setError(null);
    setSubmitMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}/submit`, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `제출 실패 (HTTP ${res.status})`);
          return;
        }
        setSubmitMsg(
          "제출 완료. 직원이 검토 후 미리보기를 알림톡으로 보내드릴게요.",
        );
        // 제출 후 status 변경되었으므로 /me 로 이동
        setTimeout(() => router.push("/me"), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-[12px] text-fg-secondary leading-relaxed">
        입력하신 자료를 확인해주세요. 제출하면 직원이 검수해서 페이지를 만들고
        미리보기 알림톡을 보내드립니다.
      </p>

      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-2">
          필수 정보 ({essentialChecks.filter((c) => c.ok).length}/
          {essentialChecks.length})
        </h3>
        <ul className="space-y-1">
          {essentialChecks.map((c) => (
            <li
              key={c.label}
              className="flex items-center justify-between text-[12px] px-3 py-2 rounded-md bg-bg-soft border border-border-default"
            >
              <span className="text-fg">{c.label}</span>
              <span
                className={
                  c.ok ? "text-success text-[11px]" : "text-danger text-[11px]"
                }
              >
                {c.ok ? "완료" : "미입력"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-2">
          블록 자료 ({blockChecks.filter((c) => c.ok).length}/{blockChecks.length})
        </h3>
        <ul className="space-y-1">
          {blockChecks.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between text-[12px] px-3 py-2 rounded-md bg-bg-soft border border-border-default"
            >
              <span className="text-fg">{c.label}</span>
              <span
                className={
                  c.ok ? "text-success text-[11px]" : "text-fg-tertiary text-[11px]"
                }
              >
                {c.ok ? "완료" : "비어있음 (직원 보강)"}
              </span>
            </li>
          ))}
          {blockChecks.length === 0 && (
            <li className="text-[11px] text-fg-tertiary text-center py-4">
              입력 대상 블록이 없습니다.
            </li>
          )}
        </ul>
      </section>

      {submitMsg && (
        <p className="text-[12px] text-success bg-success-soft px-3 py-2 rounded">
          {submitMsg}
        </p>
      )}
      {error && (
        <p className="text-[12px] text-danger bg-danger-soft px-3 py-2 rounded">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending || !requiredOk}
        className="w-full px-5 py-3 rounded-md bg-info text-fg-inverse text-[14px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "제출 중..." : "제출하기 — 우리가 만들어드릴게요"}
      </button>
      {!requiredOk && (
        <p className="text-[10px] text-fg-tertiary text-center">
          필수 정보를 모두 채우면 제출 버튼이 활성화됩니다.
        </p>
      )}
    </div>
  );
}
