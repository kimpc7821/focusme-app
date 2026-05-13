"use client";

import type { BlockFormProps } from "./types";
import {
  AssetUrlPicker,
  Field,
  Section,
  Select,
  TextArea,
  TextInput,
} from "./inputs";

type Layout = "plain" | "with_image_left" | "with_image_right" | "with_quote";
type TextAlign = "left" | "center";
type MaxWidth = "narrow" | "wide";

interface Quote {
  text?: string;
  author?: string;
}

export function BrandStoryForm({
  config,
  content,
  onConfig,
  onContent,
  assets,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "plain";
  const textAlign = (config.textAlign as TextAlign) ?? "left";
  const maxWidth = (config.maxWidth as MaxWidth) ?? "narrow";

  const title = (content.title as string) ?? "";
  const body = (content.body as string) ?? "";
  const imageUrl = (content.imageUrl as string) ?? "";
  const quote = (content.quote as Quote) ?? {};

  return (
    <div className="space-y-6">
      <Section title="콘텐츠">
        <Field label="섹션 제목 (선택)">
          <TextInput
            value={title}
            onChange={(v) => onContent({ ...content, title: v })}
            placeholder="우리의 시작"
          />
        </Field>
        <Field label="본문" hint="빈 줄로 단락 구분">
          <TextArea
            value={body}
            onChange={(v) => onContent({ ...content, body: v })}
            rows={8}
            placeholder="도예 작가 부부가..."
          />
        </Field>
        {(layout === "with_image_left" || layout === "with_image_right") && (
          <Field label="이미지 URL">
            <AssetUrlPicker
              value={imageUrl}
              onChange={(v) => onContent({ ...content, imageUrl: v })}
              assets={assets}
              category="lifestyle"
            />
          </Field>
        )}
        {layout === "with_quote" && (
          <>
            <Field label="인용 텍스트">
              <TextArea
                value={quote.text ?? ""}
                onChange={(v) =>
                  onContent({ ...content, quote: { ...quote, text: v } })
                }
                rows={3}
                placeholder="당신의 하루 끝에 머무는…"
              />
            </Field>
            <Field label="인용 출처 (선택)">
              <TextInput
                value={quote.author ?? ""}
                onChange={(v) =>
                  onContent({ ...content, quote: { ...quote, author: v } })
                }
                placeholder="고객 김OO"
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "plain", label: "기본" },
              { value: "with_image_left", label: "좌측 이미지" },
              { value: "with_image_right", label: "우측 이미지" },
              { value: "with_quote", label: "인용 강조" },
            ]}
          />
        </Field>
        <Field label="정렬">
          <Select<TextAlign>
            value={textAlign}
            onChange={(v) => onConfig({ ...config, textAlign: v })}
            options={[
              { value: "left", label: "왼쪽" },
              { value: "center", label: "가운데" },
            ]}
          />
        </Field>
        <Field label="너비">
          <Select<MaxWidth>
            value={maxWidth}
            onChange={(v) => onConfig({ ...config, maxWidth: v })}
            options={[
              { value: "narrow", label: "좁게 (60ch)" },
              { value: "wide", label: "넓게 (80ch)" },
            ]}
          />
        </Field>
      </Section>
    </div>
  );
}
