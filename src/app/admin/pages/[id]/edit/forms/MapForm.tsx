"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, Select, TextInput, Toggle } from "./inputs";

type Provider = "naver" | "kakao" | "google";
type Height = "small" | "medium" | "large";

export function MapForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const provider = (config.provider as Provider) ?? "naver";
  const height = (config.height as Height) ?? "medium";
  const showDirectionsButton = (config.showDirectionsButton as boolean) ?? true;
  const zoom = (config.zoom as number) ?? 16;

  const latitude = content.latitude as number | undefined;
  const longitude = content.longitude as number | undefined;
  const address = (content.address as string) ?? "";
  const placeName = (content.placeName as string) ?? "";
  const directionsUrl = (content.directionsUrl as string) ?? "";

  return (
    <div className="space-y-6">
      <Section title="위치">
        <Field label="장소명">
          <TextInput
            value={placeName}
            onChange={(v) => onContent({ ...content, placeName: v })}
            placeholder="노을공방"
          />
        </Field>
        <Field label="주소 (표시용)">
          <TextInput
            value={address}
            onChange={(v) => onContent({ ...content, address: v })}
            placeholder="서울시 마포구 연남동 123-45"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="위도">
            <TextInput
              value={latitude !== undefined ? String(latitude) : ""}
              onChange={(v) =>
                onContent({
                  ...content,
                  latitude: v ? Number(v) : undefined,
                })
              }
              placeholder="37.5611"
            />
          </Field>
          <Field label="경도">
            <TextInput
              value={longitude !== undefined ? String(longitude) : ""}
              onChange={(v) =>
                onContent({
                  ...content,
                  longitude: v ? Number(v) : undefined,
                })
              }
              placeholder="126.9234"
            />
          </Field>
        </div>
        <Field label="외부 길찾기 URL (선택)">
          <TextInput
            value={directionsUrl}
            onChange={(v) => onContent({ ...content, directionsUrl: v })}
            placeholder="https://map.naver.com/..."
          />
        </Field>
      </Section>

      <Section title="레이아웃">
        <Field label="지도 제공자">
          <Select<Provider>
            value={provider}
            onChange={(v) => onConfig({ ...config, provider: v })}
            options={[
              { value: "naver", label: "네이버 지도 (추천)" },
              { value: "kakao", label: "카카오 지도" },
              { value: "google", label: "Google Maps" },
            ]}
          />
        </Field>
        <Field label="높이">
          <Select<Height>
            value={height}
            onChange={(v) => onConfig({ ...config, height: v })}
            options={[
              { value: "small", label: "작게 (200px)" },
              { value: "medium", label: "중간 (300px)" },
              { value: "large", label: "크게 (400px)" },
            ]}
          />
        </Field>
        <Field label="줌 (14~18)">
          <TextInput
            type="number"
            value={String(zoom)}
            onChange={(v) =>
              onConfig({ ...config, zoom: v ? Number(v) : 16 })
            }
            placeholder="16"
          />
        </Field>
        <Toggle
          checked={showDirectionsButton}
          onChange={(v) =>
            onConfig({ ...config, showDirectionsButton: v })
          }
          label="길찾기 버튼 표시"
        />
      </Section>
    </div>
  );
}
