"use client";

import type { BlockFormProps } from "./types";
import {
  AssetUrlPicker,
  Field,
  Section,
  Select,
  TextInput,
  Toggle,
} from "./inputs";

type Layout = "grid_2col" | "grid_3col" | "masonry" | "carousel";
type AspectRatio = "square" | "portrait" | "landscape" | "original";

interface Image {
  url?: string;
  caption?: string;
  alt?: string;
}

export function GalleryGridForm({
  config,
  content,
  onConfig,
  onContent,
  assets,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "grid_2col";
  const aspectRatio = (config.aspectRatio as AspectRatio) ?? "square";
  const showCaption = (config.showCaption as boolean) ?? false;
  const enableLightbox = (config.enableLightbox as boolean) ?? true;

  const title = (content.title as string) ?? "";
  const images = (content.images as Image[]) ?? [];
  const setImages = (next: Image[]) =>
    onContent({ ...content, images: next });
  const update = (i: number, patch: Partial<Image>) =>
    setImages(images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));
  const remove = (i: number) =>
    setImages(images.filter((_, idx) => idx !== i));
  const add = () => setImages([...images, {}]);

  return (
    <div className="space-y-6">
      <Section title="섹션">
        <Field label="제목 (선택)">
          <TextInput
            value={title}
            onChange={(v) => onContent({ ...content, title: v })}
            placeholder="작업 갤러리"
          />
        </Field>
      </Section>

      <Section title="이미지">
        {images.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">이미지를 추가하세요.</p>
        )}
        {images.map((img, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">이미지 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="URL">
              <AssetUrlPicker
                value={img.url ?? ""}
                onChange={(v) => update(i, { url: v })}
                assets={assets}
                category="lifestyle"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="캡션 (선택)">
                <TextInput
                  value={img.caption ?? ""}
                  onChange={(v) => update(i, { caption: v })}
                />
              </Field>
              <Field label="alt (선택)">
                <TextInput
                  value={img.alt ?? ""}
                  onChange={(v) => update(i, { alt: v })}
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-md border border-dashed border-border-default text-[12px] text-fg-secondary hover:bg-bg-soft"
        >
          + 이미지 추가
        </button>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "grid_2col", label: "2열 그리드" },
              { value: "grid_3col", label: "3열 그리드" },
              { value: "masonry", label: "매소너리" },
              { value: "carousel", label: "가로 슬라이드" },
            ]}
          />
        </Field>
        <Field label="비율">
          <Select<AspectRatio>
            value={aspectRatio}
            onChange={(v) => onConfig({ ...config, aspectRatio: v })}
            options={[
              { value: "square", label: "정사각형" },
              { value: "portrait", label: "세로형" },
              { value: "landscape", label: "가로형" },
              { value: "original", label: "원본 비율" },
            ]}
          />
        </Field>
        <Toggle
          checked={showCaption}
          onChange={(v) => onConfig({ ...config, showCaption: v })}
          label="캡션 표시"
        />
        <Toggle
          checked={enableLightbox}
          onChange={(v) => onConfig({ ...config, enableLightbox: v })}
          label="라이트박스 (클릭 확대)"
        />
      </Section>
    </div>
  );
}
