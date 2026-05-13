"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, Select, TextInput, Toggle } from "./inputs";

type Layout = "card" | "minimal";

export function InstagramEmbedForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "card";
  const showCaption = (config.showCaption as boolean) ?? true;

  const postUrl = (content.postUrl as string) ?? "";
  const cachedImageUrl = (content.cachedImageUrl as string) ?? "";
  const cachedCaption = (content.cachedCaption as string) ?? "";

  return (
    <div className="space-y-6">
      <Section title="게시물">
        <Field label="인스타그램 URL" hint="https://instagram.com/p/...">
          <TextInput
            value={postUrl}
            onChange={(v) => onContent({ ...content, postUrl: v })}
            placeholder="https://www.instagram.com/p/CABCDEFGHIJ/"
          />
        </Field>
        <Field label="캐시된 이미지 URL (선택)" hint="API 응답 캐시">
          <TextInput
            value={cachedImageUrl}
            onChange={(v) => onContent({ ...content, cachedImageUrl: v })}
          />
        </Field>
        <Field label="캐시된 캡션 (선택)">
          <TextInput
            value={cachedCaption}
            onChange={(v) => onContent({ ...content, cachedCaption: v })}
          />
        </Field>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "card", label: "카드" },
              { value: "minimal", label: "미니멀" },
            ]}
          />
        </Field>
        <Toggle
          checked={showCaption}
          onChange={(v) => onConfig({ ...config, showCaption: v })}
          label="캡션 표시"
        />
      </Section>
    </div>
  );
}
