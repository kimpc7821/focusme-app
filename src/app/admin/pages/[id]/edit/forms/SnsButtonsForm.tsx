"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, Select, TextInput, Toggle } from "./inputs";

type Layout = "grid_2col" | "grid_3col" | "horizontal_scroll";
type IconStyle = "colored" | "monochrome";
type SnsType =
  | "instagram"
  | "blog"
  | "youtube"
  | "tiktok"
  | "naver_place"
  | "naver_cafe"
  | "smartstore"
  | "website"
  | "custom";

interface SnsItem {
  type: SnsType;
  url: string;
  label?: string;
  icon?: string;
}

export function SnsButtonsForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "grid_3col";
  const iconStyle = (config.iconStyle as IconStyle) ?? "colored";
  const showLabels = (config.showLabels as boolean) ?? true;

  const items = (content.items as SnsItem[]) ?? [];
  const setItems = (next: SnsItem[]) =>
    onContent({ ...content, items: next });
  const update = (i: number, patch: Partial<SnsItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const add = () =>
    setItems([...items, { type: "instagram", url: "" }]);

  return (
    <div className="space-y-6">
      <Section title="SNS 항목">
        {items.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">SNS 를 추가하세요.</p>
        )}
        {items.map((it, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">SNS #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="종류">
              <Select<SnsType>
                value={it.type}
                onChange={(v) => update(i, { type: v })}
                options={[
                  { value: "instagram", label: "Instagram" },
                  { value: "blog", label: "네이버 블로그" },
                  { value: "youtube", label: "YouTube" },
                  { value: "tiktok", label: "TikTok" },
                  { value: "naver_place", label: "네이버 플레이스" },
                  { value: "naver_cafe", label: "네이버 카페" },
                  { value: "smartstore", label: "스마트스토어" },
                  { value: "website", label: "웹사이트" },
                  { value: "custom", label: "커스텀" },
                ]}
              />
            </Field>
            <Field label="URL">
              <TextInput
                value={it.url}
                onChange={(v) => update(i, { url: v })}
                placeholder="https://..."
              />
            </Field>
            <Field label="라벨 (선택)" hint="비우면 종류 기본값 사용">
              <TextInput
                value={it.label ?? ""}
                onChange={(v) => update(i, { label: v })}
              />
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-md border border-dashed border-border-default text-[12px] text-fg-secondary hover:bg-bg-soft"
        >
          + SNS 추가
        </button>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "grid_3col", label: "3열 그리드" },
              { value: "grid_2col", label: "2열 그리드" },
              { value: "horizontal_scroll", label: "가로 슬라이드" },
            ]}
          />
        </Field>
        <Field label="아이콘 스타일">
          <Select<IconStyle>
            value={iconStyle}
            onChange={(v) => onConfig({ ...config, iconStyle: v })}
            options={[
              { value: "colored", label: "공식 색상" },
              { value: "monochrome", label: "단색" },
            ]}
          />
        </Field>
        <Toggle
          checked={showLabels}
          onChange={(v) => onConfig({ ...config, showLabels: v })}
          label="라벨 표시"
        />
      </Section>
    </div>
  );
}
