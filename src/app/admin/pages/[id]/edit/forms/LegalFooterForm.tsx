"use client";

import type { BlockFormProps } from "./types";
import {
  EssentialManagedField,
  Field,
  Section,
  TextInput,
  Toggle,
} from "./inputs";

export function LegalFooterForm({
  config,
  content,
  onConfig,
  onContent,
  essentialInfo,
}: BlockFormProps) {
  const showBusinessNumber = (config.showBusinessNumber as boolean) ?? true;
  const showEcommerceLicense =
    (config.showEcommerceLicense as boolean) ?? false;
  const showCopyright = (config.showCopyright as boolean) ?? true;

  const copyrightYear =
    content.copyrightYear !== undefined ? String(content.copyrightYear) : "";
  const ei = essentialInfo ?? {};

  return (
    <div className="space-y-6">
      <Section title="법적 정보 (essential_info)">
        <EssentialManagedField label="사업자명" value={ei.businessName} />
        <EssentialManagedField
          label="사업자등록번호"
          value={ei.businessNumber}
        />
        <EssentialManagedField
          label="통신판매업 신고번호"
          value={ei.ecommerceLicense}
          note="D2C 업종 표시 의무 · essential_info 에서 관리"
        />
        <EssentialManagedField
          label="개인정보책임자"
          value={ei.privacyOfficer}
        />
        <Field label="카피라이트 연도 (비우면 현재 연도)">
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
