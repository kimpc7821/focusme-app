"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  flattenLeafFields,
  buildContentPatch,
  type ContentField,
} from "@/lib/blocks/content-utils";
import { humanizePath } from "@/lib/blocks/labels";
import { EMPTY_SCHEMAS, getStarterContent } from "@/lib/blocks/empty-schemas";
import type { AssetRef, BlockSummary } from "./SubmitWizard";
import { AiSuggestButton } from "./AiSuggestButton";

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
  blocks: BlockSummary[];
  assets: AssetRef[];
  blockTypeMeta: Record<
    string,
    { name: string; defaultConfig: unknown; defaultContent: unknown }
  >;
}

/**
 * Step 2 — 블록별 자료 입력.
 *
 * 표시 대상: 켜진 비시스템·비숨김 블록만 (Step 0 에서 끈 블록 제외).
 * 빈 content 는 EMPTY_SCHEMAS 의 initialContent 로 starter 적용.
 *
 * 저장 정책 (C 방식):
 *   - 텍스트 입력 = 클라이언트 dirty 누적 → "저장하기" 클릭 시 일괄 PATCH
 *   - +추가/삭제 = 클라이언트 state 에 즉시 반영 → 저장 시 함께 PATCH
 *   - 이미지 업로드 = 즉시 R2 (assets POST) → 받은 URL 을 클라이언트 state 에 반영 → 저장 시 PATCH
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.3 + §9.1.1
 */
export function Step2Materials({
  pageId,
  blocks,
  assets,
  blockTypeMeta,
}: Props) {
  const router = useRouter();
  const editableBlocks = useMemo(
    () =>
      blocks
        .filter((b) => b.isEnabled && !SYSTEM_OR_HIDDEN.has(b.blockType))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [blocks],
  );

  // 블록별 starter content — 빈 content 에 EMPTY_SCHEMAS 적용
  const initialContentByBlock = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    for (const b of editableBlocks) {
      m.set(b.id, getStarterContent(b.blockType, b.content));
    }
    return m;
  }, [editableBlocks]);

  // 클라이언트 state — 모든 블록 content 의 현재 값 (사용자 입력 + 추가 항목 + 업로드된 이미지 URL)
  const [drafts, setDrafts] = useState<Map<string, Record<string, unknown>>>(
    () => new Map(initialContentByBlock),
  );

  const [pending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateBlock = (blockId: string, next: Record<string, unknown>) => {
    setDrafts((prev) => new Map(prev).set(blockId, next));
    setSaveMsg(null);
    setError(null);
  };

  const dirtyBlockIds = useMemo(() => {
    const ids: string[] = [];
    for (const b of editableBlocks) {
      const orig = b.content;
      const cur = drafts.get(b.id) ?? {};
      if (JSON.stringify(orig) !== JSON.stringify(cur)) ids.push(b.id);
    }
    return ids;
  }, [drafts, editableBlocks]);

  const handleSave = () => {
    if (dirtyBlockIds.length === 0) return;
    setError(null);
    setSaveMsg(null);

    const payload = dirtyBlockIds.map((bid) => {
      const draft = drafts.get(bid) ?? {};
      return { id: bid, content: draft };
    });

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ blocks: payload }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `저장 실패 (HTTP ${res.status})`);
          return;
        }
        setSaveMsg(`${payload.length}개 블록 저장됨`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div>
      <p className="text-[12px] text-fg-secondary leading-relaxed mb-5">
        각 블록에 들어갈 자료를 채워주세요. 비워둬도 됩니다 — 직원이 검수 시
        보강합니다.
      </p>

      <div className="space-y-5">
        {editableBlocks.length === 0 && (
          <p className="text-[12px] text-fg-tertiary text-center py-8">
            입력할 블록이 없습니다. Step 0 에서 블록을 켜주세요.
          </p>
        )}
        {editableBlocks.map((b) => (
          <BlockCard
            key={b.id}
            block={b}
            content={drafts.get(b.id) ?? {}}
            onChange={(next) => updateBlock(b.id, next)}
            blockName={blockTypeMeta[b.blockType]?.name ?? b.blockType}
            pageId={pageId}
            assets={assets.filter((a) => a.blockId === b.id || a.blockId === null)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 bg-bg border-t border-border-default flex items-center justify-between gap-3">
        <div className="text-[12px] text-fg-tertiary">
          {dirtyBlockIds.length > 0
            ? `${dirtyBlockIds.length}개 블록에 변경사항 있음`
            : "변경 사항 없음"}
          {saveMsg && (
            <span className="ml-2 text-success">· {saveMsg}</span>
          )}
          {error && <span className="ml-2 text-danger">· {error}</span>}
        </div>
        <button
          type="button"
          disabled={pending || dirtyBlockIds.length === 0}
          onClick={handleSave}
          className="px-5 py-2 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

/** 블록 1개 카드 — 텍스트 필드 + 리스트 +추가/삭제 + 이미지 업로드 */
function BlockCard({
  block,
  content,
  onChange,
  blockName,
  pageId,
  assets,
}: {
  block: BlockSummary;
  content: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  blockName: string;
  pageId: string;
  assets: AssetRef[];
}) {
  const schema = EMPTY_SCHEMAS[block.blockType];
  const fields = useMemo(() => flattenLeafFields(content), [content]);

  // 텍스트 입력 변경 — content 의 path 자리에 새 값 적용
  const setFieldValue = (field: ContentField, newValue: string) => {
    const updatedField: ContentField = { ...field, value: newValue };
    const patched = buildContentPatch(content, [updatedField]);
    onChange(patched);
  };

  return (
    <section className="bg-bg-soft rounded-lg border border-border-default p-5">
      <header className="mb-3">
        <h3 className="text-[13px] font-medium text-fg">{blockName}</h3>
        <p className="text-[10px] text-fg-tertiary font-mono">
          {block.blockType}
        </p>
      </header>

      {fields.length === 0 ? (
        <p className="text-[11px] text-fg-tertiary">
          입력할 항목이 없습니다 (정책상 텍스트 필드 없음).
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((f) => {
            const aiHit = schema?.aiSuggestFields?.find(
              (a) => a.path.join(".") === f.pathLabel,
            );
            return (
              <div key={f.pathLabel}>
                <FieldInput
                  field={f}
                  blockType={block.blockType}
                  onChange={(v) => setFieldValue(f, v)}
                />
                {aiHit && (
                  <AiSuggestButton
                    pageId={pageId}
                    field={aiHit.field}
                    currentValue={f.value}
                    onPick={(v) => setFieldValue(f, v)}
                    label={aiHit.label}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 리스트 +추가/삭제 (해당 블록에 listItems schema 있을 때) */}
      {schema?.listItems && (
        <div className="mt-4 space-y-2">
          {schema.listItems.map((li) => (
            <ListItemControls
              key={li.arrayPath.join(".")}
              content={content}
              arrayPath={li.arrayPath}
              itemTemplate={li.itemTemplate}
              label={li.label}
              maxItems={li.maxItems}
              minItems={li.minItems}
              onChange={onChange}
            />
          ))}
        </div>
      )}

      {/* 이미지 업로드 (리스트 항목별로) */}
      {schema?.imageFields && (
        <ImageUploadSection
          pageId={pageId}
          blockId={block.id}
          content={content}
          schema={schema.imageFields}
          listItems={schema.listItems}
          assets={assets}
          onChange={onChange}
        />
      )}
    </section>
  );
}

function FieldInput({
  field,
  blockType,
  onChange,
}: {
  field: ContentField;
  blockType: string;
  onChange: (v: string) => void;
}) {
  const label = humanizePath(blockType, field.path);
  return (
    <label className="block">
      <span className="block text-[11px] text-fg-secondary mb-1">{label}</span>
      {field.multiline ? (
        <textarea
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(6, Math.max(2, field.value.split("\n").length + 1))}
          className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg text-fg focus:outline-none focus:border-info"
        />
      ) : (
        <input
          type={field.originalType === "number" ? "number" : "text"}
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg text-fg focus:outline-none focus:border-info"
        />
      )}
    </label>
  );
}

function ListItemControls({
  content,
  arrayPath,
  itemTemplate,
  label,
  maxItems,
  minItems,
  onChange,
}: {
  content: Record<string, unknown>;
  arrayPath: string[];
  itemTemplate: Record<string, unknown>;
  label: string;
  maxItems?: number;
  minItems?: number;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const list = getArrayAt(content, arrayPath);
  const count = list.length;
  const canAdd = maxItems === undefined || count < maxItems;
  const canRemove = (minItems ?? 0) < count;

  const addItem = () => {
    if (!canAdd) return;
    const next = structuredClone(content);
    const arr = ensureArrayAt(next, arrayPath);
    arr.push(structuredClone(itemTemplate));
    onChange(next);
  };

  const removeItem = (idx: number) => {
    if (!canRemove) return;
    const next = structuredClone(content);
    const arr = ensureArrayAt(next, arrayPath);
    arr.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="flex items-center justify-between text-[11px] py-1">
      <span className="text-fg-tertiary">
        {label} · {count}개
        {maxItems !== undefined && ` (최대 ${maxItems}개)`}
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => removeItem(i)}
            disabled={!canRemove}
            className="w-6 h-6 rounded border border-border-default text-fg-tertiary hover:text-danger hover:bg-danger-soft disabled:opacity-30 text-[10px]"
            title={`${i + 1}번 삭제`}
          >
            ×{i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addItem}
          disabled={!canAdd}
          className="px-2 py-1 rounded border border-dashed border-border-default text-fg-secondary hover:bg-bg disabled:opacity-30"
        >
          + {label} 추가
        </button>
      </div>
    </div>
  );
}

function ImageUploadSection({
  pageId,
  blockId,
  content,
  schema,
  listItems,
  assets,
  onChange,
}: {
  pageId: string;
  blockId: string;
  content: Record<string, unknown>;
  schema: NonNullable<
    (typeof EMPTY_SCHEMAS)[string]
  >["imageFields"];
  listItems: (typeof EMPTY_SCHEMAS)[string]["listItems"];
  assets: AssetRef[];
  onChange: (next: Record<string, unknown>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  if (!schema || schema.length === 0) return null;

  // 리스트 안 이미지인지 (slides[i].imageUrl) 판단 — schema 의 첫 path 가 number 포함하면 리스트형
  const isList = schema[0].path.some((seg) => typeof seg === "number");

  // 업로드 후 path 자리에 URL 입력
  const handleUpload = async (
    file: File,
    targetPath: (string | number)[],
    category: "logo" | "main_image" | "product_image" | "lifestyle",
  ) => {
    setUploading(true);
    setUploadErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      form.append("blockId", blockId);

      const res = await fetch(`/api/v1/me/pages/${pageId}/assets`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadErr(json?.error?.message ?? `업로드 실패 (HTTP ${res.status})`);
        return;
      }
      const url = json?.data?.asset?.url as string;
      if (!url) {
        setUploadErr("업로드 URL 누락");
        return;
      }

      const next = structuredClone(content);
      setAtPath(next, targetPath, url);
      onChange(next);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  // 리스트형 — 각 리스트 항목별 업로드 버튼
  if (isList && listItems && listItems.length > 0) {
    const arrayPath = listItems[0].arrayPath;
    const items = getArrayAt(content, arrayPath);
    const innerKey = String(schema[0].path[schema[0].path.length - 1]);
    const category = schema[0].category;

    return (
      <div className="mt-4 pt-4 border-t border-border-default space-y-2">
        <p className="text-[11px] text-fg-secondary">사진 업로드</p>
        {items.map((item, i) => {
          const value = (item as Record<string, unknown>)[innerKey] as string;
          return (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="text-fg-tertiary w-6">{i + 1}번</span>
              {value ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={value}
                  alt=""
                  className="w-10 h-10 rounded object-cover border border-border-default"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-bg border border-border-default" />
              )}
              <label className="flex-1 cursor-pointer">
                <span className="px-2 py-1 rounded border border-border-default text-fg-secondary hover:bg-bg inline-block">
                  {uploading ? "업로드 중..." : "파일 선택"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      handleUpload(
                        f,
                        [...arrayPath, i, innerKey],
                        category,
                      );
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          );
        })}
        {uploadErr && (
          <p className="text-[10px] text-danger">{uploadErr}</p>
        )}
        {assets.length > 0 && (
          <p className="text-[10px] text-fg-tertiary">
            업로드된 자료 {assets.length}개
          </p>
        )}
      </div>
    );
  }

  return null;
}

// ─── path 유틸 ──────────────────────────────────────────────────

function getArrayAt(
  obj: Record<string, unknown>,
  path: string[],
): unknown[] {
  let cur: unknown = obj;
  for (const seg of path) {
    if (cur && typeof cur === "object" && seg in (cur as object)) {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return [];
    }
  }
  return Array.isArray(cur) ? cur : [];
}

function ensureArrayAt(
  obj: Record<string, unknown>,
  path: string[],
): unknown[] {
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (!cur[seg] || typeof cur[seg] !== "object") cur[seg] = {};
    cur = cur[seg] as Record<string, unknown>;
  }
  const last = path[path.length - 1];
  if (!Array.isArray(cur[last])) cur[last] = [];
  return cur[last] as unknown[];
}

function setAtPath(
  obj: Record<string, unknown>,
  path: (string | number)[],
  value: unknown,
): void {
  let cur: Record<string, unknown> | unknown[] = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    const nextSeg = path[i + 1];
    const wantArray = typeof nextSeg === "number";
    const key = seg as keyof typeof cur;
    let existing = (cur as Record<string | number, unknown>)[key as never];
    if (existing === undefined || existing === null) {
      existing = wantArray ? [] : {};
      (cur as Record<string | number, unknown>)[key as never] = existing as never;
    }
    cur = existing as Record<string, unknown> | unknown[];
  }
  (cur as Record<string | number, unknown>)[path[path.length - 1] as never] =
    value as never;
}
