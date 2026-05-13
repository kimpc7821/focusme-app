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

type Layout = "cards_vertical" | "cards_horizontal_scroll" | "quote_style";

interface Review {
  text?: string;
  rating?: number;
  author?: string;
  date?: string;
  sourceUrl?: string;
}

export function ReviewsForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "cards_vertical";
  const showRating = (config.showRating as boolean) ?? true;
  const showAuthor = (config.showAuthor as boolean) ?? true;
  const showDate = (config.showDate as boolean) ?? false;
  const maxItems = (config.maxItems as number) ?? 3;

  const title = (content.title as string) ?? "";
  const reviews = (content.reviews as Review[]) ?? [];
  const setReviews = (next: Review[]) =>
    onContent({ ...content, reviews: next });
  const update = (i: number, patch: Partial<Review>) =>
    setReviews(reviews.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) =>
    setReviews(reviews.filter((_, idx) => idx !== i));
  const add = () => setReviews([...reviews, { rating: 5 }]);

  return (
    <div className="space-y-6">
      <Section title="섹션">
        <Field label="제목 (선택)">
          <TextInput
            value={title}
            onChange={(v) => onContent({ ...content, title: v })}
            placeholder="고객 후기"
          />
        </Field>
      </Section>

      <Section title="후기">
        {reviews.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">후기를 추가하세요.</p>
        )}
        {reviews.map((r, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">후기 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="후기 내용">
              <TextArea
                value={r.text ?? ""}
                onChange={(v) => update(i, { text: v })}
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="평점 (1~5)">
                <TextInput
                  type="number"
                  value={r.rating !== undefined ? String(r.rating) : ""}
                  onChange={(v) =>
                    update(i, { rating: v ? Number(v) : undefined })
                  }
                  placeholder="5"
                />
              </Field>
              <Field label="작성자">
                <TextInput
                  value={r.author ?? ""}
                  onChange={(v) => update(i, { author: v })}
                  placeholder="김OO 님"
                />
              </Field>
              <Field label="날짜">
                <TextInput
                  value={r.date ?? ""}
                  onChange={(v) => update(i, { date: v })}
                  placeholder="2026-04"
                />
              </Field>
            </div>
            <Field label="원본 URL (선택)">
              <TextInput
                value={r.sourceUrl ?? ""}
                onChange={(v) => update(i, { sourceUrl: v })}
                placeholder="https://smartstore.naver.com/..."
              />
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-md border border-dashed border-border-default text-[12px] text-fg-secondary hover:bg-bg-soft"
        >
          + 후기 추가
        </button>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "cards_vertical", label: "세로 카드" },
              { value: "cards_horizontal_scroll", label: "가로 슬라이드" },
              { value: "quote_style", label: "인용 스타일" },
            ]}
          />
        </Field>
        <Field label="기본 표시 개수">
          <TextInput
            type="number"
            value={String(maxItems)}
            onChange={(v) =>
              onConfig({ ...config, maxItems: v ? Number(v) : 3 })
            }
            placeholder="3"
          />
        </Field>
        <Toggle
          checked={showRating}
          onChange={(v) => onConfig({ ...config, showRating: v })}
          label="평점 표시"
        />
        <Toggle
          checked={showAuthor}
          onChange={(v) => onConfig({ ...config, showAuthor: v })}
          label="작성자 표시"
        />
        <Toggle
          checked={showDate}
          onChange={(v) => onConfig({ ...config, showDate: v })}
          label="날짜 표시"
        />
      </Section>
    </div>
  );
}
