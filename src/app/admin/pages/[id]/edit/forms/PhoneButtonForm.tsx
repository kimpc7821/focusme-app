"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, Select, TextInput, Toggle } from "./inputs";

type Size = "medium" | "large";
type Layout = "fullwidth" | "inline";

export function PhoneButtonForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const size = (config.size as Size) ?? "medium";
  const layout = (config.layout as Layout) ?? "fullwidth";
  const showIcon = (config.showIcon as boolean) ?? true;

  const phone = (content.phone as string) ?? "";
  const label = (content.label as string) ?? "";
  const subtext = (content.subtext as string) ?? "";

  return (
    <div className="space-y-6">
      <Section title="콘텐츠">
        <Field label="전화번호">
          <TextInput
            value={phone}
            onChange={(v) => onContent({ ...content, phone: v })}
            placeholder="02-1234-5678"
          />
        </Field>
        <Field label="라벨 (선택)" hint="기본: 전화하기">
          <TextInput
            value={label}
            onChange={(v) => onContent({ ...content, label: v })}
            placeholder="전화하기"
          />
        </Field>
        <Field label="보조 텍스트 (선택)">
          <TextInput
            value={subtext}
            onChange={(v) => onContent({ ...content, subtext: v })}
            placeholder="평일 10~18시"
          />
        </Field>
      </Section>

      <Section title="레이아웃">
        <Field label="너비">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "fullwidth", label: "전체 너비" },
              { value: "inline", label: "인라인" },
            ]}
          />
        </Field>
        <Field label="크기">
          <Select<Size>
            value={size}
            onChange={(v) => onConfig({ ...config, size: v })}
            options={[
              { value: "medium", label: "중간" },
              { value: "large", label: "크게" },
            ]}
          />
        </Field>
        <Toggle
          checked={showIcon}
          onChange={(v) => onConfig({ ...config, showIcon: v })}
          label="아이콘 표시"
        />
      </Section>
    </div>
  );
}
