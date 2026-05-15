"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BlockSummary, RecommendedOptional } from "./SubmitWizard";

interface Props {
  pageId: string;
  blocks: BlockSummary[];
  recommendedOptionalBlocks: RecommendedOptional[];
  blockTypeMeta: Record<
    string,
    { name: string; defaultConfig: unknown; defaultContent: unknown }
  >;
}

/**
 * Step 0 — 페이지 구성 토글.
 * 그룹 3개:
 *   1) 시스템 블록 — 사장님 자물쇠 (UI 노출 X)
 *   2) 기본 포함 (비시스템·이미 추가된 블록) — ON/OFF 토글
 *   3) 추가 가능 (lookup_templates.recommended_optional_blocks 중 아직 없는 것) — 켜기 버튼
 *
 * 숨김 블록 (phone_button · kakao_channel) 은 admin 자동 추가 영역이므로 노출 X.
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.1 + §9
 */

const SYSTEM_BLOCK_TYPES = new Set([
  "profile_header",
  "location_info",
  "legal_footer",
  "floating_cta",
]);

const HIDDEN_BLOCK_TYPES = new Set(["phone_button", "kakao_channel"]);

export function Step0BlockToggle({
  pageId,
  blocks,
  recommendedOptionalBlocks,
  blockTypeMeta,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { basicBlocks, optionalToAdd } = useMemo(() => {
    const existingTypes = new Set(blocks.map((b) => b.blockType));
    const basic = blocks
      .filter(
        (b) =>
          !SYSTEM_BLOCK_TYPES.has(b.blockType) &&
          !HIDDEN_BLOCK_TYPES.has(b.blockType),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const optional = recommendedOptionalBlocks.filter(
      (o) => !existingTypes.has(o.blockType),
    );
    return { basicBlocks: basic, optionalToAdd: optional };
  }, [blocks, recommendedOptionalBlocks]);

  const [optimisticBasicBlocks, applyOptimisticToggle] = useOptimistic(
    basicBlocks,
    (current: BlockSummary[], action: { id: string; enabled: boolean }) =>
      current.map((b) =>
        b.id === action.id ? { ...b, isEnabled: action.enabled } : b,
      ),
  );

  const toggleBlock = (block: BlockSummary, nextEnabled: boolean) => {
    setError(null);
    startTransition(async () => {
      applyOptimisticToggle({ id: block.id, enabled: nextEnabled });
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            blocks: [{ id: block.id, isEnabled: nextEnabled }],
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `저장 실패 (HTTP ${res.status})`);
          router.refresh();
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        router.refresh();
      }
    });
  };

  const enableOptional = (opt: RecommendedOptional) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}/blocks/enable`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            blockType: opt.blockType,
            sortOrder: opt.sortOrder,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `추가 실패 (HTTP ${res.status})`);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-fg-secondary leading-relaxed">
        이런 구성으로 만들어드릴게요. 빼고 싶은 게 있으면 끄고, 추가하고 싶은 게
        있으면 켜주세요.
      </p>

      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-2">
          필수 (자동 포함)
        </h3>
        <p className="text-[11px] text-fg-tertiary mb-3">
          프로필 헤더 · 오시는 길 · 법적 푸터 · Floating 버튼 — 모든 페이지에 자동
          적용됩니다.
        </p>
      </section>

      <section>
        <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-2">
          기본 포함 ({basicBlocks.length}개)
        </h3>
        <ul className="space-y-2">
          {optimisticBasicBlocks.map((b) => {
            const meta = blockTypeMeta[b.blockType];
            return (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-md border border-border-default"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-fg">
                    {meta?.name ?? b.blockType}
                  </p>
                  <p className="text-[10px] text-fg-tertiary font-mono">
                    {b.blockType}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-[12px] text-fg cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={b.isEnabled}
                    onChange={(e) => toggleBlock(b, e.target.checked)}
                  />
                  {b.isEnabled ? "켜짐" : "꺼짐"}
                </label>
              </li>
            );
          })}
          {optimisticBasicBlocks.length === 0 && (
            <li className="text-[12px] text-fg-tertiary text-center py-6">
              기본 포함 블록이 없습니다.
            </li>
          )}
        </ul>
      </section>

      {optionalToAdd.length > 0 && (
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-2">
            추가 가능 ({optionalToAdd.length}개)
          </h3>
          <ul className="space-y-2">
            {optionalToAdd.map((o) => (
              <li
                key={o.blockType}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-md bg-bg-soft border border-border-default"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-fg-secondary">{o.label}</p>
                  <p className="text-[10px] text-fg-tertiary font-mono">
                    {o.blockType}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => enableOptional(o)}
                  className="px-3 py-1.5 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg disabled:opacity-50 shrink-0"
                >
                  켜기
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="text-[12px] text-danger bg-danger-soft px-3 py-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
