"use client";

import { useState } from "react";

interface Props {
  name?: string;
  defaultValue?: number | string | null;
  value?: number | string | null;
  onChange?: (raw: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  step?: number;
}

/**
 * 숫자 입력 — 표시는 천 단위 콤마, name 으로 폼 제출 시 raw 숫자 문자열.
 *
 * 두 모드:
 *   - uncontrolled: name + defaultValue → form action 으로 hidden field 통해 raw 제출
 *   - controlled:   value + onChange  → 부모가 raw 문자열 관리
 *
 * 사용처: 가격·견적·금액 등.
 */
export function NumberInput({
  name,
  defaultValue,
  value,
  onChange,
  placeholder,
  className,
  min,
  step,
}: Props) {
  const controlled = value !== undefined;
  const format = (raw: string | number | null | undefined): string => {
    if (raw == null || raw === "") return "";
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString();
  };

  const [internal, setInternal] = useState<string>(() => format(defaultValue));
  const display = controlled ? format(value) : internal;
  const rawValue = display.replace(/,/g, "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const formatted = raw === "" ? "" : Number(raw).toLocaleString();
    if (!controlled) setInternal(formatted);
    onChange?.(raw);
  };

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={
          placeholder != null
            ? format(placeholder).length > 0
              ? format(placeholder)
              : placeholder
            : undefined
        }
        className={className}
        data-min={min}
        data-step={step}
      />
      {name && <input type="hidden" name={name} value={rawValue} />}
    </>
  );
}
