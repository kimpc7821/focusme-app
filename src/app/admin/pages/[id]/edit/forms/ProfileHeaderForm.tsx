"use client";

import type { BlockFormProps } from "./types";
import {
  AssetUrlPicker,
  EssentialManagedField,
  Field,
  Section,
  Select,
  TextInput,
  Toggle,
} from "./inputs";

type Layout = "centered" | "left_aligned";
type LogoShape = "circle" | "square" | "rounded";

export function ProfileHeaderForm({
  config,
  content,
  onConfig,
  onContent,
  assets,
  essentialInfo,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "centered";
  const showTagline = (config.showTagline as boolean) ?? true;
  const logoShape = (config.logoShape as LogoShape) ?? "rounded";
  const logoUrl = (content.logoUrl as string) ?? "";
  const badge = (content.badge as string) ?? "";

  return (
    <div className="space-y-6">
      <Section title="콘텐츠">
        <EssentialManagedField
          label="브랜드명"
          value={essentialInfo?.businessName}
        />
        <EssentialManagedField
          label="한 줄 카피"
          value={essentialInfo?.tagline}
        />
        <Field
          label="로고 이미지 URL"
          hint="비워두면 첫 글자가 자동으로 표시됩니다"
        >
          <AssetUrlPicker
            value={logoUrl}
            onChange={(v) => onContent({ ...content, logoUrl: v })}
            assets={assets}
            category="logo"
          />
        </Field>
        <Field label="배지 (선택)" hint="예: 공식 인증">
          <TextInput
            value={badge}
            onChange={(v) => onContent({ ...content, badge: v })}
          />
        </Field>
      </Section>

      <Section title="레이아웃">
        <Field label="정렬">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "centered", label: "가운데 정렬" },
              { value: "left_aligned", label: "왼쪽 정렬" },
            ]}
          />
        </Field>
        <Field label="로고 모양">
          <Select<LogoShape>
            value={logoShape}
            onChange={(v) => onConfig({ ...config, logoShape: v })}
            options={[
              { value: "rounded", label: "둥근 사각형" },
              { value: "circle", label: "원" },
              { value: "square", label: "사각형" },
            ]}
          />
        </Field>
        <Toggle
          checked={showTagline}
          onChange={(v) => onConfig({ ...config, showTagline: v })}
          label="한 줄 카피 표시"
        />
      </Section>
    </div>
  );
}
