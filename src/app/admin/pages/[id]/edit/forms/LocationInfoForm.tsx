"use client";

import type { BlockFormProps } from "./types";
import {
  EssentialManagedField,
  Field,
  Section,
  Select,
  TextInput,
  Toggle,
} from "./inputs";

type Layout = "map_top" | "info_top" | "no_map";
type MapHeight = "small" | "medium" | "large";

export function LocationInfoForm({
  config,
  content,
  onConfig,
  onContent,
  essentialInfo,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "map_top";
  const showMap = (config.showMap as boolean) ?? true;
  const showHours = (config.showHours as boolean) ?? true;
  const showAddress = (config.showAddress as boolean) ?? true;
  const showActionButtons = (config.showActionButtons as boolean) ?? true;
  const mapHeight = (config.mapHeight as MapHeight) ?? "medium";

  const sectionTitle = (content.sectionTitle as string) ?? "";
  const sectionSubtitle = (content.sectionSubtitle as string) ?? "";
  const directionsUrl = (content.directionsUrl as string) ?? "";

  const ei = essentialInfo ?? {};
  const hoursSummary = [
    ei.hours?.weekdays && `평일 ${ei.hours.weekdays}`,
    ei.hours?.saturday && `토 ${ei.hours.saturday}`,
    ei.hours?.sunday && `일 ${ei.hours.sunday}`,
    ei.hours?.holiday && `공휴일 ${ei.hours.holiday}`,
    ei.hours?.note,
  ]
    .filter(Boolean)
    .join(" · ");
  const addressSummary = [ei.address?.full, ei.address?.detail]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <Section title="섹션 헤더">
        <Field label="섹션 제목">
          <TextInput
            value={sectionTitle}
            onChange={(v) => onContent({ ...content, sectionTitle: v })}
            placeholder="오시는 길"
          />
        </Field>
        <Field label="부제 (선택)">
          <TextInput
            value={sectionSubtitle}
            onChange={(v) => onContent({ ...content, sectionSubtitle: v })}
            placeholder="언제든 들러주세요"
          />
        </Field>
      </Section>

      <Section title="영업시간·주소·연락처 (essential_info)">
        <EssentialManagedField label="영업시간" value={hoursSummary} />
        <EssentialManagedField label="주소" value={addressSummary} />
        <EssentialManagedField label="전화" value={ei.phone} />
        <EssentialManagedField label="이메일" value={ei.email} />
        <EssentialManagedField
          label="카카오톡 채널 URL"
          value={ei.kakaoUrl}
        />
        <Field label="길찾기 URL (선택, 네이버 지도 등)">
          <TextInput
            value={directionsUrl}
            onChange={(v) => onContent({ ...content, directionsUrl: v })}
            placeholder="https://map.naver.com/..."
          />
        </Field>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "map_top", label: "지도 위 + 정보 아래" },
              { value: "info_top", label: "정보 위 + 지도 아래" },
              { value: "no_map", label: "지도 없이" },
            ]}
          />
        </Field>
        <Field label="지도 높이">
          <Select<MapHeight>
            value={mapHeight}
            onChange={(v) => onConfig({ ...config, mapHeight: v })}
            options={[
              { value: "small", label: "작게" },
              { value: "medium", label: "중간" },
              { value: "large", label: "크게" },
            ]}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            checked={showMap}
            onChange={(v) => onConfig({ ...config, showMap: v })}
            label="지도 표시"
          />
          <Toggle
            checked={showHours}
            onChange={(v) => onConfig({ ...config, showHours: v })}
            label="영업시간 표시"
          />
          <Toggle
            checked={showAddress}
            onChange={(v) => onConfig({ ...config, showAddress: v })}
            label="주소 표시"
          />
          <Toggle
            checked={showActionButtons}
            onChange={(v) => onConfig({ ...config, showActionButtons: v })}
            label="액션 버튼 (전화/카톡/길찾기)"
          />
        </div>
      </Section>
    </div>
  );
}
