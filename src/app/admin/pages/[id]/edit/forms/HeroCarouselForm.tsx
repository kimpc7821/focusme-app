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

type Layout = "fullscreen" | "aspect_16_9" | "aspect_4_5";
type Overlay = "none" | "dark" | "light" | "gradient";
type TextPos = "top" | "center" | "bottom";

interface Slide {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  cta?: { label?: string; url?: string };
}

export function HeroCarouselForm({
  config,
  content,
  onConfig,
  onContent,
  assets,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "aspect_4_5";
  const autoPlay = (config.autoPlay as boolean) ?? false;
  const duration = (config.duration as number) ?? 4000;
  const showIndicators = (config.showIndicators as boolean) ?? true;
  const overlay = (config.overlay as Overlay) ?? "gradient";
  const textPosition = (config.textPosition as TextPos) ?? "bottom";

  const slides = (content.slides as Slide[]) ?? [];
  const setSlides = (next: Slide[]) =>
    onContent({ ...content, slides: next });
  const update = (i: number, patch: Partial<Slide>) =>
    setSlides(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) =>
    setSlides(slides.filter((_, idx) => idx !== i));
  const add = () => setSlides([...slides, {}]);

  return (
    <div className="space-y-6">
      <Section title="슬라이드">
        {slides.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">슬라이드를 추가하세요.</p>
        )}
        {slides.map((slide, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">슬라이드 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="이미지 URL" hint="비우면 브랜드 그라디언트 fallback">
              <AssetUrlPicker
                value={slide.imageUrl ?? ""}
                onChange={(v) => update(i, { imageUrl: v })}
                assets={assets}
                category="main_image"
              />
            </Field>
            <Field label="제목 (선택)">
              <TextInput
                value={slide.title ?? ""}
                onChange={(v) => update(i, { title: v })}
                placeholder="노을의 향"
              />
            </Field>
            <Field label="부제 (선택)">
              <TextInput
                value={slide.subtitle ?? ""}
                onChange={(v) => update(i, { subtitle: v })}
                placeholder="당신의 하루 끝에 머무는"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="CTA 라벨 (선택)">
                <TextInput
                  value={slide.cta?.label ?? ""}
                  onChange={(v) =>
                    update(i, {
                      cta: { ...(slide.cta ?? {}), label: v },
                    })
                  }
                  placeholder="자세히 보기"
                />
              </Field>
              <Field label="CTA URL (선택)">
                <TextInput
                  value={slide.cta?.url ?? ""}
                  onChange={(v) =>
                    update(i, {
                      cta: { ...(slide.cta ?? {}), url: v },
                    })
                  }
                  placeholder="https://..."
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
          + 슬라이드 추가
        </button>
      </Section>

      <Section title="레이아웃">
        <Field label="비율">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "aspect_4_5", label: "4:5 (세로형, 모바일)" },
              { value: "aspect_16_9", label: "16:9 (와이드)" },
              { value: "fullscreen", label: "풀스크린" },
            ]}
          />
        </Field>
        <Field label="오버레이">
          <Select<Overlay>
            value={overlay}
            onChange={(v) => onConfig({ ...config, overlay: v })}
            options={[
              { value: "gradient", label: "그라디언트" },
              { value: "dark", label: "어둡게" },
              { value: "light", label: "밝게" },
              { value: "none", label: "없음" },
            ]}
          />
        </Field>
        <Field label="텍스트 위치">
          <Select<TextPos>
            value={textPosition}
            onChange={(v) => onConfig({ ...config, textPosition: v })}
            options={[
              { value: "bottom", label: "하단" },
              { value: "center", label: "가운데" },
              { value: "top", label: "상단" },
            ]}
          />
        </Field>
        <Toggle
          checked={autoPlay}
          onChange={(v) => onConfig({ ...config, autoPlay: v })}
          label="자동 재생"
        />
        {autoPlay && (
          <Field label="전환 시간 (ms)">
            <TextInput
              type="number"
              value={String(duration)}
              onChange={(v) =>
                onConfig({ ...config, duration: v ? Number(v) : 4000 })
              }
              placeholder="4000"
            />
          </Field>
        )}
        <Toggle
          checked={showIndicators}
          onChange={(v) => onConfig({ ...config, showIndicators: v })}
          label="인디케이터 표시"
        />
      </Section>
    </div>
  );
}
