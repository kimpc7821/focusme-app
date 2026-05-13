"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, TextInput, Toggle } from "./inputs";

export function LegalFooterForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const showBusinessNumber = (config.showBusinessNumber as boolean) ?? true;
  const showEcommerceLicense =
    (config.showEcommerceLicense as boolean) ?? false;
  const showCopyright = (config.showCopyright as boolean) ?? true;

  const businessName = (content.businessName as string) ?? "";
  const businessNumber = (content.businessNumber as string) ?? "";
  const ecommerceLicense = (content.ecommerceLicense as string) ?? "";
  const privacyOfficer = (content.privacyOfficer as string) ?? "";
  const copyrightYear =
    content.copyrightYear !== undefined ? String(content.copyrightYear) : "";

  return (
    <div className="space-y-6">
      <Section title="법적 정보">
        <Field label="사업자명">
          <TextInput
            value={businessName}
            onChange={(v) => onContent({ ...content, businessName: v })}
            placeholder="노을공방"
          />
        </Field>
        <Field label="사업자등록번호">
          <TextInput
            value={businessNumber}
            onChange={(v) => onContent({ ...content, businessNumber: v })}
            placeholder="123-45-67890"
          />
        </Field>
        <Field
          label="통신판매업 신고번호"
          hint="D2C 업종은 표시 의무"
        >
          <TextInput
            value={ecommerceLicense}
            onChange={(v) => onContent({ ...content, ecommerceLicense: v })}
            placeholder="제 2026-서울마포-1234호"
          />
        </Field>
        <Field label="개인정보책임자 (선택)">
          <TextInput
            value={privacyOfficer}
            onChange={(v) => onContent({ ...content, privacyOfficer: v })}
            placeholder="홍길동"
          />
        </Field>
        <Field
          label="카피라이트 연도 (비우면 현재 연도)"
        >
          <TextInput
            type="number"
            value={copyrightYear}
            onChange={(v) =>
              onContent({
                ...content,
                copyrightYear: v ? Number(v) : undefined,
              })
            }
            placeholder="2026"
          />
        </Field>
      </Section>

      <Section title="표시 여부">
        <Toggle
          checked={showBusinessNumber}
          onChange={(v) => onConfig({ ...config, showBusinessNumber: v })}
          label="사업자등록번호 표시"
        />
        <Toggle
          checked={showEcommerceLicense}
          onChange={(v) => onConfig({ ...config, showEcommerceLicense: v })}
          label="통신판매업 신고 표시 (D2C 필수)"
        />
        <Toggle
          checked={showCopyright}
          onChange={(v) => onConfig({ ...config, showCopyright: v })}
          label="카피라이트 표시"
        />
      </Section>
    </div>
  );
}
