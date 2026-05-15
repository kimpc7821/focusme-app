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

type Position = "right_bottom" | "left_bottom" | "right_middle" | "left_middle";
type Size = "small" | "medium" | "large";
type ButtonType = "phone" | "kakao" | "message" | "external";

interface ButtonItem {
  type: ButtonType;
  label: string;
  value: string;
  icon?: string;
}

export function FloatingCtaForm({
  config,
  content,
  onConfig,
  onContent,
  essentialInfo,
}: BlockFormProps) {
  const ei = essentialInfo ?? {};
  const position = (config.position as Position) ?? "right_middle";
  const buttonSize = (config.buttonSize as Size) ?? "medium";
  const showOnScroll = (config.showOnScroll as boolean) ?? false;

  const rawButtons = (content.buttons as ButtonItem[]) ?? [];
  const setButtons = (next: ButtonItem[]) =>
    onContent({ ...content, buttons: next });
  const update = (idx: number, patch: Partial<ButtonItem>) =>
    setButtons(rawButtons.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  const remove = (idx: number) =>
    setButtons(rawButtons.filter((_, i) => i !== idx));
  const add = () =>
    setButtons([...rawButtons, { type: "kakao", label: "카톡 문의", value: "" }]);

  return (
    <div className="space-y-6">
      <Section title="위치·크기">
        <Field label="위치">
          <Select<Position>
            value={position}
            onChange={(v) => onConfig({ ...config, position: v })}
            options={[
              { value: "right_middle", label: "우측 중간" },
              { value: "right_bottom", label: "우측 하단" },
              { value: "left_middle", label: "좌측 중간" },
              { value: "left_bottom", label: "좌측 하단" },
            ]}
          />
        </Field>
        <Field label="버튼 크기">
          <Select<Size>
            value={buttonSize}
            onChange={(v) => onConfig({ ...config, buttonSize: v })}
            options={[
              { value: "small", label: "작게" },
              { value: "medium", label: "중간" },
              { value: "large", label: "크게" },
            ]}
          />
        </Field>
        <Toggle
          checked={showOnScroll}
          onChange={(v) => onConfig({ ...config, showOnScroll: v })}
          label="스크롤 시작 후에만 표시"
        />
      </Section>

      <Section title="버튼">
        {rawButtons.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">버튼을 추가하세요.</p>
        )}
        {rawButtons.map((btn, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">버튼 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="종류">
              <Select<ButtonType>
                value={btn.type}
                onChange={(v) => update(i, { type: v })}
                options={[
                  { value: "phone", label: "전화" },
                  { value: "kakao", label: "카카오톡" },
                  { value: "message", label: "문자" },
                  { value: "external", label: "외부 링크" },
                ]}
              />
            </Field>
            <Field label="라벨">
              <TextInput
                value={btn.label}
                onChange={(v) => update(i, { label: v })}
                placeholder="카톡 문의"
              />
            </Field>
            {btn.type === "phone" ? (
              <EssentialManagedField
                label="전화번호"
                value={ei.phone}
                note="essential_info.phone 자동 주입"
              />
            ) : btn.type === "kakao" ? (
              <EssentialManagedField
                label="카카오 채널 URL"
                value={ei.kakaoUrl}
                note="essential_info.kakaoUrl 자동 주입"
              />
            ) : (
              <Field
                label="값"
                hint={btn.type === "message" ? "전화번호" : "URL"}
              >
                <TextInput
                  value={btn.value}
                  onChange={(v) => update(i, { value: v })}
                  placeholder={
                    btn.type === "message"
                      ? "02-1234-5678"
                      : "https://example.com"
                  }
                />
              </Field>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-md border border-dashed border-border-default text-[12px] text-fg-secondary hover:bg-bg-soft"
        >
          + 버튼 추가
        </button>
      </Section>
    </div>
  );
}
