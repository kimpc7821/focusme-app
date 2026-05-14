"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { humanizePath } from "./labels";

export interface EditableBlock {
  id: string;
  blockType: string;
  label: string;
  content: Record<string, unknown>;
}

/**
 * content JSON 에서 string·number leaf 만 path 와 함께 평탄화.
 * 배열은 인덱스로 path 에 포함 (예: ["slides", 0, "image_url"]).
 * leaf 가 빈 string 인 것도 노출 (사장님이 입력하고 싶을 수 있어서).
 * originalType 보존 — 저장 시 number 필드는 number 로 되돌릴 수 있게.
 */
interface Field {
  path: (string | number)[];
  pathLabel: string; // path.join('.') — drafts map key
  value: string;
  originalType: "string" | "number";
  multiline: boolean;
}

function flattenLeafFields(
  obj: unknown,
  basePath: (string | number)[] = [],
): Field[] {
  const out: Field[] = [];
  if (obj === null || obj === undefined) return out;

  if (typeof obj === "string" || typeof obj === "number") {
    const value = String(obj);
    out.push({
      path: basePath,
      pathLabel: basePath.join("."),
      value,
      originalType: typeof obj as "string" | "number",
      multiline: value.length > 60 || value.includes("\n"),
    });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      out.push(...flattenLeafFields(item, [...basePath, i]));
    });
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out.push(...flattenLeafFields(v, [...basePath, k]));
    }
    return out;
  }
  return out;
}

/**
 * path 기반으로 nested object 패치 재구성.
 * 예: [["slides", 0, "caption"], "새 캡션"] → { slides: [{ caption: "새 캡션" }] }
 */
function setByPath(
  target: Record<string, unknown>,
  path: (string | number)[],
  value: unknown,
): void {
  let cur: Record<string, unknown> | unknown[] = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    const wantArray = typeof nextKey === "number";
    const ck = key as keyof typeof cur;
    let existing = (cur as Record<string | number, unknown>)[ck as never];
    if (existing === undefined || existing === null) {
      existing = wantArray ? [] : {};
      (cur as Record<string | number, unknown>)[ck as never] = existing as never;
    }
    cur = existing as Record<string, unknown> | unknown[];
  }
  (cur as Record<string | number, unknown>)[path[path.length - 1] as never] =
    value as never;
}

export function EditForm({
  pageId,
  blocks,
}: {
  pageId: string;
  blocks: EditableBlock[];
}) {
  const initialFieldsByBlock = useMemo(() => {
    const m = new Map<string, Field[]>();
    for (const b of blocks) m.set(b.id, flattenLeafFields(b.content));
    return m;
  }, [blocks]);

  // [blockId, pathLabel] → 현재 입력값
  const [drafts, setDrafts] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const [bid, fs] of initialFieldsByBlock) {
      for (const f of fs) m.set(`${bid}::${f.pathLabel}`, f.value);
    }
    return m;
  });

  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dirtyByBlock = useMemo(() => {
    const m = new Map<string, Field[]>();
    for (const [bid, fs] of initialFieldsByBlock) {
      const dirty = fs
        .map((f) => {
          const cur = drafts.get(`${bid}::${f.pathLabel}`) ?? f.value;
          return cur !== f.value ? { ...f, value: cur } : null;
        })
        .filter((f): f is Field => f !== null);
      if (dirty.length > 0) m.set(bid, dirty);
    }
    return m;
  }, [drafts, initialFieldsByBlock]);

  const totalDirty = Array.from(dirtyByBlock.values()).reduce(
    (s, fs) => s + fs.length,
    0,
  );

  const handleChange = (bid: string, label: string, v: string) => {
    setDrafts((prev) => {
      const next = new Map(prev);
      next.set(`${bid}::${label}`, v);
      return next;
    });
    setSavedMsg(null);
    setErrMsg(null);
  };

  const handleSave = () => {
    if (totalDirty === 0) return;

    // PATCH body: dirty 블록의 원본 content 를 deep clone → 변경된 path 만 덮어씀.
    // 부분 patch + 서버 deepMerge 조합이 배열을 통째로 replace 하는 문제를 회피.
    // (slides[0].image_url 만 보내면 slides 가 [{image_url}] 로 줄어들어 다른 슬라이드·필드가 사라짐.)
    const blocksPayload = Array.from(dirtyByBlock.entries()).map(
      ([bid, fields]) => {
        const block = blocks.find((b) => b.id === bid)!;
        const merged = structuredClone(block.content) as Record<string, unknown>;
        for (const f of fields) {
          const cast =
            f.originalType === "number" && f.value.trim() !== "" && !isNaN(Number(f.value))
              ? Number(f.value)
              : f.value;
          setByPath(merged, f.path, cast);
        }
        return { id: bid, content: merged };
      },
    );

    startTransition(async () => {
      setErrMsg(null);
      setSavedMsg(null);
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ blocks: blocksPayload }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrMsg(
            json?.error?.message ?? `저장 실패 (HTTP ${res.status})`,
          );
          return;
        }
        const applied = json?.data?.changesApplied?.length ?? 0;
        setSavedMsg(`${applied}개 항목 저장됨 — 페이지에 반영되었습니다`);
        router.refresh();
      } catch (err) {
        setErrMsg(
          "저장 실패: " +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    });
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-soft -mx-6 px-6 py-3 mb-4 border-b border-border-default flex items-center justify-between">
        <div className="text-[12px] text-fg-tertiary">
          {totalDirty > 0 ? (
            <span className="text-fg">
              변경됨 · {totalDirty}개 항목 저장 대기
            </span>
          ) : (
            <span>변경 사항이 없습니다</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || totalDirty === 0}
          className="px-4 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {savedMsg && (
        <p className="mb-3 text-[12px] text-success bg-success-soft px-3 py-2 rounded">
          ✓ {savedMsg}
        </p>
      )}
      {errMsg && (
        <p className="mb-3 text-[12px] text-danger bg-danger-soft px-3 py-2 rounded">
          ⚠ {errMsg}
        </p>
      )}

      <div className="space-y-4">
        {blocks.length === 0 && (
          <p className="text-[13px] text-fg-tertiary text-center py-10">
            편집 가능한 블록이 없습니다.
          </p>
        )}
        {blocks.map((b) => {
          const fields = initialFieldsByBlock.get(b.id) ?? [];
          return (
            <section
              key={b.id}
              className="bg-bg rounded-lg border border-border-default p-5"
            >
              <h2 className="text-[13px] font-medium text-fg mb-1">
                {b.label}
              </h2>
              <p className="text-[10px] text-fg-tertiary font-mono mb-3">
                {b.blockType}
              </p>

              {fields.length === 0 ? (
                <p className="text-[11px] text-fg-tertiary">
                  편집 가능한 텍스트가 없습니다 (이미지·연락처 위주 블록).
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((f) => {
                    const draftKey = `${b.id}::${f.pathLabel}`;
                    const draft = drafts.get(draftKey) ?? f.value;
                    const isDirty = draft !== f.value;
                    return (
                      <label
                        key={f.pathLabel}
                        className="block"
                      >
                        <span className="flex items-center gap-2 text-[11px] text-fg-secondary mb-1">
                          <span>{humanizePath(b.blockType, f.path)}</span>
                          {isDirty && (
                            <span className="text-[10px] text-ai-text-token">
                              ● 변경됨
                            </span>
                          )}
                        </span>
                        {f.multiline ? (
                          <textarea
                            value={draft}
                            onChange={(e) =>
                              handleChange(b.id, f.pathLabel, e.target.value)
                            }
                            rows={Math.min(
                              6,
                              Math.max(2, draft.split("\n").length + 1),
                            )}
                            className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
                          />
                        ) : (
                          <input
                            value={draft}
                            onChange={(e) =>
                              handleChange(b.id, f.pathLabel, e.target.value)
                            }
                            className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
