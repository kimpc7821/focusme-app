"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, Select, TextInput, Toggle } from "./inputs";

type Layout = "map_top" | "info_top" | "no_map";
type MapHeight = "small" | "medium" | "large";

interface Hours {
  weekdays?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
  note?: string;
}
interface Address {
  full?: string;
  detail?: string;
  latitude?: number;
  longitude?: number;
}

export function LocationInfoForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "map_top";
  const showMap = (config.showMap as boolean) ?? true;
  const showHours = (config.showHours as boolean) ?? true;
  const showAddress = (config.showAddress as boolean) ?? true;
  const showActionButtons = (config.showActionButtons as boolean) ?? true;
  const mapHeight = (config.mapHeight as MapHeight) ?? "medium";

  const sectionTitle = (content.sectionTitle as string) ?? "";
  const sectionSubtitle = (content.sectionSubtitle as string) ?? "";
  const hours = (content.hours as Hours) ?? {};
  const address = (content.address as Address) ?? {};
  const phone = (content.phone as string) ?? "";
  const email = (content.email as string) ?? "";
  const kakao = (content.kakao as string) ?? "";
  const directionsUrl = (content.directionsUrl as string) ?? "";

  const setHours = (next: Hours) =>
    onContent({ ...content, hours: { ...hours, ...next } });
  const setAddress = (next: Address) =>
    onContent({ ...content, address: { ...address, ...next } });

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

      <Section title="영업시간">
        <div className="grid grid-cols-2 gap-3">
          <Field label="평일">
            <TextInput
              value={hours.weekdays ?? ""}
              onChange={(v) => setHours({ weekdays: v })}
              placeholder="10:00 ~ 18:00"
            />
          </Field>
          <Field label="토요일">
            <TextInput
              value={hours.saturday ?? ""}
              onChange={(v) => setHours({ saturday: v })}
              placeholder="10:00 ~ 17:00"
            />
          </Field>
          <Field label="일요일">
            <TextInput
              value={hours.sunday ?? ""}
              onChange={(v) => setHours({ sunday: v })}
              placeholder="휴무"
            />
          </Field>
          <Field label="공휴일">
            <TextInput
              value={hours.holiday ?? ""}
              onChange={(v) => setHours({ holiday: v })}
              placeholder="휴무"
            />
          </Field>
        </div>
        <Field label="비고">
          <TextInput
            value={hours.note ?? ""}
            onChange={(v) => setHours({ note: v })}
            placeholder="공휴일 휴무"
          />
        </Field>
      </Section>

      <Section title="주소·연락처">
        <Field label="주소">
          <TextInput
            value={address.full ?? ""}
            onChange={(v) => setAddress({ full: v })}
            placeholder="서울시 마포구 연남동 123-45"
          />
        </Field>
        <Field label="상세 주소 (선택)">
          <TextInput
            value={address.detail ?? ""}
            onChange={(v) => setAddress({ detail: v })}
            placeholder="노을빌딩 2층"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="위도 (선택)">
            <TextInput
              value={
                address.latitude !== undefined ? String(address.latitude) : ""
              }
              onChange={(v) =>
                setAddress({ latitude: v ? Number(v) : undefined })
              }
              placeholder="37.5611"
            />
          </Field>
          <Field label="경도 (선택)">
            <TextInput
              value={
                address.longitude !== undefined ? String(address.longitude) : ""
              }
              onChange={(v) =>
                setAddress({ longitude: v ? Number(v) : undefined })
              }
              placeholder="126.9234"
            />
          </Field>
        </div>
        <Field label="전화">
          <TextInput
            value={phone}
            onChange={(v) => onContent({ ...content, phone: v })}
            placeholder="02-1234-5678"
          />
        </Field>
        <Field label="이메일">
          <TextInput
            value={email}
            onChange={(v) => onContent({ ...content, email: v })}
            placeholder="hello@noeul.com"
          />
        </Field>
        <Field label="카카오톡 채널 URL">
          <TextInput
            value={kakao}
            onChange={(v) => onContent({ ...content, kakao: v })}
            placeholder="https://pf.kakao.com/_noeul"
          />
        </Field>
        <Field label="길찾기 URL (네이버 지도 등)">
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
