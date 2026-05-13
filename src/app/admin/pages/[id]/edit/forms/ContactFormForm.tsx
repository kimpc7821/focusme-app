"use client";

import type { BlockFormProps } from "./types";
import {
  Field,
  Section,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./inputs";

type Layout = "vertical" | "two_column";
type SubmitDestination = "email" | "kakao" | "both";
type FieldType = "text" | "textarea" | "tel" | "email" | "select";

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export function ContactFormForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "vertical";
  const submitDestination =
    (config.submitDestination as SubmitDestination) ?? "email";
  const showPrivacyConsent = (config.showPrivacyConsent as boolean) ?? true;

  const title = (content.title as string) ?? "";
  const subtitle = (content.subtitle as string) ?? "";
  const submitLabel = (content.submitLabel as string) ?? "";
  const thanksMessage = (content.thanksMessage as string) ?? "";
  const notificationEmail = (content.notificationEmail as string) ?? "";
  const fields = (content.fields as FormField[]) ?? [];

  const setFields = (next: FormField[]) =>
    onContent({ ...content, fields: next });
  const update = (i: number, patch: Partial<FormField>) =>
    setFields(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const remove = (i: number) =>
    setFields(fields.filter((_, idx) => idx !== i));
  const add = () =>
    setFields([
      ...fields,
      { key: `field_${fields.length + 1}`, label: "", type: "text", required: false },
    ]);

  return (
    <div className="space-y-6">
      <Section title="섹션">
        <Field label="제목 (선택)">
          <TextInput
            value={title}
            onChange={(v) => onContent({ ...content, title: v })}
            placeholder="문의하기"
          />
        </Field>
        <Field label="부제 (선택)">
          <TextInput
            value={subtitle}
            onChange={(v) => onContent({ ...content, subtitle: v })}
          />
        </Field>
      </Section>

      <Section title="입력 필드">
        {fields.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">필드를 추가하세요.</p>
        )}
        {fields.map((f, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">필드 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="키 (영문)">
                <TextInput
                  value={f.key}
                  onChange={(v) => update(i, { key: v })}
                  placeholder="name"
                />
              </Field>
              <Field label="라벨">
                <TextInput
                  value={f.label}
                  onChange={(v) => update(i, { label: v })}
                  placeholder="이름"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="타입">
                <Select<FieldType>
                  value={f.type}
                  onChange={(v) => update(i, { type: v })}
                  options={[
                    { value: "text", label: "텍스트" },
                    { value: "textarea", label: "여러 줄" },
                    { value: "tel", label: "전화번호" },
                    { value: "email", label: "이메일" },
                    { value: "select", label: "선택" },
                  ]}
                />
              </Field>
              <Toggle
                checked={f.required}
                onChange={(v) => update(i, { required: v })}
                label="필수"
              />
            </div>
            <Field label="플레이스홀더 (선택)">
              <TextInput
                value={f.placeholder ?? ""}
                onChange={(v) => update(i, { placeholder: v })}
              />
            </Field>
            {f.type === "select" && (
              <Field label="옵션 (줄바꿈 구분)">
                <TextArea
                  value={(f.options ?? []).join("\n")}
                  onChange={(v) =>
                    update(i, {
                      options: v.split("\n").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  rows={3}
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
          + 필드 추가
        </button>
      </Section>

      <Section title="제출">
        <Field label="제출 버튼 라벨" hint="기본: 보내기">
          <TextInput
            value={submitLabel}
            onChange={(v) => onContent({ ...content, submitLabel: v })}
            placeholder="보내기"
          />
        </Field>
        <Field label="제출 후 메시지">
          <TextInput
            value={thanksMessage}
            onChange={(v) => onContent({ ...content, thanksMessage: v })}
            placeholder="감사합니다. 빠르게 연락드릴게요!"
          />
        </Field>
        <Field label="알림 받을 이메일">
          <TextInput
            value={notificationEmail}
            onChange={(v) => onContent({ ...content, notificationEmail: v })}
            placeholder="owner@example.com"
          />
        </Field>
      </Section>

      <Section title="레이아웃·정책">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "vertical", label: "세로" },
              { value: "two_column", label: "2단" },
            ]}
          />
        </Field>
        <Field label="제출 destination">
          <Select<SubmitDestination>
            value={submitDestination}
            onChange={(v) => onConfig({ ...config, submitDestination: v })}
            options={[
              { value: "email", label: "이메일" },
              { value: "kakao", label: "카카오" },
              { value: "both", label: "둘 다" },
            ]}
          />
        </Field>
        <Toggle
          checked={showPrivacyConsent}
          onChange={(v) =>
            onConfig({ ...config, showPrivacyConsent: v })
          }
          label="개인정보 동의 체크박스 (한국 법규)"
        />
      </Section>
    </div>
  );
}
