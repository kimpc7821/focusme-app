"use client";

import { useState } from "react";
import type { Block } from "@/lib/types";
import { SectionTitle } from "./SectionTitle";
import { getOrCreateSessionId } from "@/lib/tracking/session";

type FieldType = "text" | "textarea" | "tel" | "email" | "select";

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Config {
  layout: "vertical" | "two_column";
  submitDestination: "email" | "kakao" | "both";
  showPrivacyConsent: boolean;
}
interface Content {
  title?: string;
  subtitle?: string;
  fields: FormField[];
  submitLabel?: string;
  thanksMessage?: string;
  notificationEmail?: string;
}

type Props = Block<Config, Content>;

export function ContactForm({ id: blockId, pageId, config, content }: Props) {
  const fields = content.fields ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const setField = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (const f of fields) {
      if (f.required && !values[f.key]?.trim()) {
        setError(`'${f.label}' 항목을 입력해주세요`);
        return;
      }
    }
    if (config.showPrivacyConsent && !consent) {
      setError("개인정보 수집·이용 동의가 필요합니다");
      return;
    }

    setStatus("submitting");
    try {
      await fetch("/api/v1/forms/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          blockId,
          values,
          sessionId: getOrCreateSessionId(),
        }),
        keepalive: true,
      });
      setStatus("done");
    } catch (e2) {
      setStatus("error");
      setError(e2 instanceof Error ? e2.message : String(e2));
    }
  };

  if (status === "done") {
    return (
      <section className="px-5 py-7">
        {content.title && (
          <SectionTitle title={content.title} className="mb-4" />
        )}
        <div
          className="rounded-md p-5 text-center"
          style={{
            background: "var(--brand-light)",
            border: "0.5px solid var(--brand-accent)",
          }}
        >
          <p className="text-[14px] font-medium text-fg">
            {content.thanksMessage || "감사합니다. 빠르게 연락드릴게요!"}
          </p>
        </div>
      </section>
    );
  }

  const gridClass =
    config.layout === "two_column"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
      : "space-y-3";

  return (
    <section className="px-5 py-7">
      {content.title && (
        <SectionTitle
          title={content.title}
          subtitle={content.subtitle}
          className="mb-4"
        />
      )}
      <form onSubmit={onSubmit} className={gridClass}>
        {fields.map((f) => {
          const v = values[f.key] ?? "";
          const inputCls =
            "w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-[var(--brand-primary)] focus:bg-bg";
          const labelLine = (
            <label
              htmlFor={`cf-${f.key}`}
              className="block text-[11px] text-fg-secondary mb-1"
            >
              {f.label}
              {f.required && (
                <span className="text-danger ml-0.5">*</span>
              )}
            </label>
          );
          let input: React.ReactNode;
          if (f.type === "textarea") {
            input = (
              <textarea
                id={`cf-${f.key}`}
                value={v}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={4}
                className={`${inputCls} resize-y leading-relaxed`}
                required={f.required}
              />
            );
          } else if (f.type === "select") {
            input = (
              <select
                id={`cf-${f.key}`}
                value={v}
                onChange={(e) => setField(f.key, e.target.value)}
                className={inputCls}
                required={f.required}
              >
                <option value="" disabled>
                  선택…
                </option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            );
          } else {
            input = (
              <input
                id={`cf-${f.key}`}
                type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : "text"}
                value={v}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={inputCls}
                required={f.required}
              />
            );
          }
          // textarea는 항상 한 row 전체
          const span = f.type === "textarea" ? "sm:col-span-2" : "";
          return (
            <div key={f.key} className={span}>
              {labelLine}
              {input}
            </div>
          );
        })}

        {config.showPrivacyConsent && (
          <label
            className={`flex items-start gap-2 text-[11px] text-fg-secondary ${
              config.layout === "two_column" ? "sm:col-span-2" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              개인정보 수집·이용에 동의합니다 (이름·연락처는 문의 응대 외
              목적으로 사용하지 않습니다)
            </span>
          </label>
        )}

        {error && (
          <p
            className={`text-[11px] text-danger ${
              config.layout === "two_column" ? "sm:col-span-2" : ""
            }`}
          >
            ⚠ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className={`py-3 rounded-md font-medium text-[14px] transition-opacity hover:opacity-90 disabled:opacity-50 ${
            config.layout === "two_column" ? "sm:col-span-2" : ""
          }`}
          style={{
            background: "var(--brand-primary)",
            color: "var(--brand-primary-text)",
          }}
        >
          {status === "submitting"
            ? "보내는 중..."
            : content.submitLabel || "보내기"}
        </button>
      </form>
    </section>
  );
}
