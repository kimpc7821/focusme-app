"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addBlockAction,
  updateBlockAction,
  deleteBlockAction,
  moveBlockAction,
} from "../../../_actions/blocks";
import { deleteAssetAction } from "../../../_actions/assets";

interface BlockRow {
  id: string;
  block_type: string;
  sort_order: number;
  is_enabled: boolean;
  is_system: boolean;
  config: Record<string, unknown>;
  content: Record<string, unknown>;
}

interface AssetRow {
  id: string;
  category: string;
  url: string;
  meta: Record<string, unknown>;
}

interface BlockTypeMeta {
  key: string;
  name: string;
  category: string;
  is_system: boolean;
  default_config: unknown;
  default_content: unknown;
}

interface Props {
  pageId: string;
  pageSlug: string;
  blocks: BlockRow[];
  assets: AssetRow[];
  blockTypes: BlockTypeMeta[];
}

const ASSET_CATEGORIES = [
  { key: "logo", label: "로고" },
  { key: "main_image", label: "메인" },
  { key: "product_image", label: "상품" },
  { key: "lifestyle", label: "분위기" },
  { key: "text", label: "텍스트" },
  { key: "other", label: "기타" },
] as const;

export function Editor({
  pageId,
  blocks,
  assets,
  blockTypes,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    blocks[0]?.id ?? null,
  );
  const [showAdd, setShowAdd] = useState(false);
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-[280px_1fr_300px] gap-5">
      {/* 좌측 — 블록 리스트 */}
      <div className="bg-bg rounded-lg border border-border-default p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium">
            블록 ({blocks.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-2 py-1 rounded text-[11px] bg-info text-fg-inverse hover:opacity-90"
          >
            + 추가
          </button>
        </div>
        <ul className="space-y-1">
          {blocks.map((b) => (
            <BlockListItem
              key={b.id}
              block={b}
              isSelected={b.id === selectedId}
              onSelect={() => setSelectedId(b.id)}
              pageId={pageId}
            />
          ))}
        </ul>
        {blocks.length === 0 && (
          <p className="text-[12px] text-fg-tertiary py-6 text-center">
            블록이 없습니다.
          </p>
        )}
      </div>

      {/* 중앙 — 블록 편집 */}
      <div className="bg-bg rounded-lg border border-border-default p-5 min-h-[500px]">
        {selected ? (
          <BlockEditor
            key={selected.id}
            pageId={pageId}
            block={selected}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[13px] text-fg-tertiary">
            왼쪽에서 블록을 선택하거나 새로 추가하세요.
          </div>
        )}
      </div>

      {/* 우측 — 자료 */}
      <AssetsPanel pageId={pageId} assets={assets} />

      {showAdd && (
        <AddBlockModal
          pageId={pageId}
          blockTypes={blockTypes}
          onClose={() => setShowAdd(false)}
          onAdded={(blockId) => {
            setSelectedId(blockId);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function BlockListItem({
  block,
  isSelected,
  onSelect,
  pageId,
}: {
  block: BlockRow;
  isSelected: boolean;
  onSelect: () => void;
  pageId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const move = (direction: "up" | "down") => {
    startTransition(async () => {
      const r = await moveBlockAction(pageId, block.id, direction);
      if (r.error) alert(r.error);
      else router.refresh();
    });
  };

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded text-left text-[12px] ${
          isSelected
            ? "bg-info-soft text-info"
            : "text-fg hover:bg-bg-soft"
        } ${!block.is_enabled ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-fg-tertiary text-[10px] w-5 font-mono shrink-0">
            {block.sort_order}
          </span>
          <span className="truncate">{block.block_type}</span>
          {block.is_system && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-bg-soft text-fg-tertiary shrink-0">
              sys
            </span>
          )}
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 shrink-0"
        >
          <button
            type="button"
            disabled={pending}
            onClick={() => move("up")}
            className="w-5 h-5 rounded hover:bg-bg-muted text-fg-tertiary disabled:opacity-30"
            aria-label="위로"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => move("down")}
            className="w-5 h-5 rounded hover:bg-bg-muted text-fg-tertiary disabled:opacity-30"
            aria-label="아래로"
          >
            ↓
          </button>
        </div>
      </button>
    </li>
  );
}

function BlockEditor({
  pageId,
  block,
  onDeleted,
}: {
  pageId: string;
  block: BlockRow;
  onDeleted: () => void;
}) {
  const [configJson, setConfigJson] = useState(
    JSON.stringify(block.config, null, 2),
  );
  const [contentJson, setContentJson] = useState(
    JSON.stringify(block.content, null, 2),
  );
  const [isEnabled, setIsEnabled] = useState(block.is_enabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const r = await updateBlockAction(
        pageId,
        block.id,
        configJson,
        contentJson,
        isEnabled,
      );
      if (r.error) setError(r.error);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("이 블록을 삭제합니까?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteBlockAction(pageId, block.id);
      if (r.error) setError(r.error);
      else {
        onDeleted();
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-medium text-fg">{block.block_type}</h2>
          <p className="text-[11px] text-fg-tertiary">
            sort_order: {block.sort_order}
            {block.is_system && " · 시스템 블록"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-fg">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          활성화
        </label>
      </div>

      <JsonField label="config" value={configJson} onChange={setConfigJson} />
      <div className="h-3" />
      <JsonField
        label="content"
        value={contentJson}
        onChange={setContentJson}
        rows={12}
      />

      {error && <p className="mt-3 text-[11px] text-danger">⚠ {error}</p>}

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-border-default">
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="px-3 py-1.5 rounded text-[12px] text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          블록 삭제
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="px-4 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function JsonField({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-fg-tertiary font-medium mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full px-3 py-2 text-[12px] font-mono rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
      />
    </div>
  );
}

function AddBlockModal({
  pageId,
  blockTypes,
  onClose,
  onAdded,
}: {
  pageId: string;
  blockTypes: BlockTypeMeta[];
  onClose: () => void;
  onAdded: (blockId: string) => void;
}) {
  const [selectedType, setSelectedType] = useState(blockTypes[0]?.key ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const add = () => {
    const meta = blockTypes.find((b) => b.key === selectedType);
    if (!meta) return;
    setError(null);
    startTransition(async () => {
      const r = await addBlockAction(
        pageId,
        meta.key,
        JSON.stringify(meta.default_config ?? {}),
        JSON.stringify(meta.default_content ?? {}),
      );
      if (r.error) setError(r.error);
      else if (r.blockId) {
        onAdded(r.blockId);
        router.refresh();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg rounded-lg shadow-modal w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-medium text-fg mb-1">블록 추가</h3>
        <p className="text-[11px] text-fg-tertiary mb-4">
          기본 config/content 로 추가 후 편집기에서 수정합니다.
        </p>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {blockTypes.map((b) => (
            <label
              key={b.key}
              className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-[13px] ${
                selectedType === b.key
                  ? "bg-info-soft text-info"
                  : "text-fg hover:bg-bg-soft"
              }`}
            >
              <input
                type="radio"
                name="blockType"
                checked={selectedType === b.key}
                onChange={() => setSelectedType(b.key)}
              />
              <span className="flex-1 font-mono text-[12px]">{b.key}</span>
              <span className="text-[11px] text-fg-tertiary">{b.name}</span>
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-[11px] text-danger">⚠ {error}</p>}
        <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[12px] text-fg-secondary hover:bg-bg-soft"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={add}
            className="px-4 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "추가 중..." : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetsPanel({
  pageId,
  assets,
}: {
  pageId: string;
  assets: AssetRow[];
}) {
  const [category, setCategory] = useState<string>("main_image");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const res = await fetch(
        `/api/v1/admin/pages/${pageId}/assets`,
        { method: "POST", body: form },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "업로드 실패");
      } else {
        router.refresh();
      }
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setPending(false);
      e.target.value = "";
    }
  };

  const remove = (id: string) => {
    if (!confirm("이 자료를 삭제합니까?")) return;
    startTransition(async () => {
      const r = await deleteAssetAction(pageId, id);
      if (r.error) alert(r.error);
      else router.refresh();
    });
  };

  return (
    <div className="bg-bg rounded-lg border border-border-default p-4">
      <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
        자료
      </h2>

      <div className="mb-3 space-y-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-2 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg"
        >
          {ASSET_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="block">
          <input
            type="file"
            accept="image/*,video/mp4"
            onChange={onFile}
            disabled={pending}
            className="block w-full text-[11px] text-fg-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-info file:text-fg-inverse file:cursor-pointer disabled:opacity-50"
          />
        </label>
        {pending && (
          <p className="text-[11px] text-fg-tertiary">업로드 중...</p>
        )}
        {error && <p className="text-[11px] text-danger">⚠ {error}</p>}
      </div>

      <ul className="space-y-2 max-h-80 overflow-y-auto">
        {assets.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-2 p-2 rounded border border-border-default"
          >
            {a.url.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={a.url}
                alt=""
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-bg-muted flex items-center justify-center text-[10px] text-fg-tertiary">
                file
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-fg truncate">
                {String(
                  (a.meta as { fileName?: string }).fileName ?? a.url,
                )}
              </p>
              <p className="text-[10px] text-fg-tertiary">{a.category}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(a.id)}
              className="text-fg-tertiary hover:text-danger text-[14px] px-1"
              aria-label="삭제"
            >
              ×
            </button>
          </li>
        ))}
        {assets.length === 0 && (
          <li className="text-[12px] text-fg-tertiary py-4 text-center">
            업로드한 자료 없음
          </li>
        )}
      </ul>
    </div>
  );
}
