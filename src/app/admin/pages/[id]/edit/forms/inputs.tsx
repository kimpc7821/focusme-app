"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] text-fg-secondary mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-fg-tertiary">{hint}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg resize-y leading-relaxed"
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-fg cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] uppercase tracking-wider text-fg-tertiary font-medium">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** 자료 URL 선택용 — 직접 입력 + assets 리스트에서 선택 */
export function AssetUrlPicker({
  value,
  onChange,
  assets,
  category,
}: {
  value: string;
  onChange: (v: string) => void;
  assets: Array<{ id: string; url: string; category: string }>;
  category?: string;
}) {
  const candidates = category
    ? assets.filter((a) => a.category === category)
    : assets;
  return (
    <div className="space-y-2">
      <TextInput
        value={value}
        onChange={onChange}
        placeholder="이미지 URL 또는 빈 칸"
      />
      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.url)}
              className={`relative w-10 h-10 rounded border ${
                value === a.url ? "border-info" : "border-border-default"
              } overflow-hidden`}
              title={a.url}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
