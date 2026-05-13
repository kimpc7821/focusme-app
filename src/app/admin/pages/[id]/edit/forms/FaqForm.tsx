"use client";

import type { BlockFormProps } from "./types";
import {
  Field,
  Section,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./inputs";

type Layout = "accordion" | "expanded";

interface FaqItem {
  question?: string;
  answer?: string;
  category?: string;
}

export function FaqForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "accordion";
  const showSearchBox = (config.showSearchBox as boolean) ?? false;
  const numbering = (config.numbering as boolean) ?? false;

  const title = (content.title as string) ?? "";
  const items = (content.items as FaqItem[]) ?? [];
  const setItems = (next: FaqItem[]) =>
    onContent({ ...content, items: next });
  const update = (i: number, patch: Partial<FaqItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, {}]);

  return (
    <div className="space-y-6">
      <Section title="섹션">
        <Field label="제목 (선택)">
          <TextInput
            value={title}
            onChange={(v) => onContent({ ...content, title: v })}
            placeholder="자주 묻는 질문"
          />
        </Field>
      </Section>

      <Section title="질문">
        {items.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">질문을 추가하세요.</p>
        )}
        {items.map((it, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">Q #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="질문">
              <TextInput
                value={it.question ?? ""}
                onChange={(v) => update(i, { question: v })}
                placeholder="배송은 얼마나 걸리나요?"
              />
            </Field>
            <Field label="답변" hint="마크다운 지원">
              <TextArea
                value={it.answer ?? ""}
                onChange={(v) => update(i, { answer: v })}
                rows={3}
              />
            </Field>
            <Field label="카테고리 (선택, 그룹핑)">
              <TextInput
                value={it.category ?? ""}
                onChange={(v) => update(i, { category: v })}
                placeholder="배송"
              />
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-md border border-dashed border-border-default text-[12px] text-fg-secondary hover:bg-bg-soft"
        >
          + 질문 추가
        </button>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "accordion", label: "아코디언 (접기)" },
              { value: "expanded", label: "펼침" },
            ]}
          />
        </Field>
        <Toggle
          checked={showSearchBox}
          onChange={(v) => onConfig({ ...config, showSearchBox: v })}
          label="검색 박스 (5개 이상 시 권장)"
        />
        <Toggle
          checked={numbering}
          onChange={(v) => onConfig({ ...config, numbering: v })}
          label="번호 매기기"
        />
      </Section>
    </div>
  );
}
