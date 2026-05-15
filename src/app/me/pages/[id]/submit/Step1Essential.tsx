"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EssentialInfo } from "@/lib/types";
import { AiSuggestButton } from "./AiSuggestButton";

interface Props {
  pageId: string;
  initialEssential: EssentialInfo;
  /** PATCH 엔드포인트 — admin 측에서 호출 시 admin 라우트 지정. 기본은 사장님 라우트. */
  endpoint?: string;
}

/**
 * Step 1 — 페이지 레벨 필수 정보 입력.
 *
 * 자동 채워진 필드 (상호명·전화·이메일): clients 정보에서 페이지 생성 시 복사된 값.
 *   사장님이 노출용으로 다르게 표기하고 싶을 수 있으니 수정 허용.
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.2 + §4.2
 */
export function Step1Essential({
  pageId,
  initialEssential,
  endpoint,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EssentialInfo>({
    businessName: initialEssential.businessName ?? "",
    tagline: initialEssential.tagline ?? "",
    phone: initialEssential.phone ?? "",
    kakaoUrl: initialEssential.kakaoUrl ?? "",
    email: initialEssential.email ?? "",
    hours: {
      weekdays: initialEssential.hours?.weekdays ?? "",
      saturday: initialEssential.hours?.saturday ?? "",
      sunday: initialEssential.hours?.sunday ?? "",
      holiday: initialEssential.hours?.holiday ?? "",
      note: initialEssential.hours?.note ?? "",
    },
    address: {
      full: initialEssential.address?.full ?? "",
      detail: initialEssential.address?.detail ?? "",
    },
    businessNumber: initialEssential.businessNumber ?? "",
    ecommerceLicense: initialEssential.ecommerceLicense ?? "",
  });

  const setField = <K extends keyof EssentialInfo>(
    key: K,
    value: EssentialInfo[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(null);
  };

  const setHours = (key: keyof NonNullable<EssentialInfo["hours"]>, value: string) =>
    setForm((prev) => ({
      ...prev,
      hours: { ...(prev.hours ?? {}), [key]: value },
    }));

  const setAddress = (
    key: keyof NonNullable<EssentialInfo["address"]>,
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      address: { ...(prev.address ?? { full: "" }), [key]: value },
    }));

  const handleSave = () => {
    setError(null);
    setSaved(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          endpoint ?? `/api/v1/me/pages/${pageId}/essential-info`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? `저장 실패 (HTTP ${res.status})`);
          return;
        }
        setSaved("저장되었습니다");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-fg-secondary leading-relaxed">
        이 정보는 페이지 곳곳에 자동으로 들어갑니다. 한 번만 적어주세요.
      </p>

      <section className="space-y-3">
        <SectionTitle>기본 정보</SectionTitle>
        <TextField
          label="상호명"
          required
          value={form.businessName ?? ""}
          onChange={(v) => setField("businessName", v)}
          hint="페이지 생성 시 자동으로 채워졌습니다. 노출용으로 다르게 적어도 됩니다."
          placeholder="노을공방"
        />
        <div>
          <TextField
            label="한 줄 카피 (선택)"
            value={form.tagline ?? ""}
            onChange={(v) => setField("tagline", v)}
            placeholder="하루의 끝, 향으로 안식을"
          />
          <AiSuggestButton
            pageId={pageId}
            field="tagline"
            currentValue={form.tagline ?? ""}
            onPick={(v) => setField("tagline", v)}
          />
        </div>
        <TextField
          label="전화번호"
          required
          value={form.phone ?? ""}
          onChange={(v) => setField("phone", v)}
          placeholder="010-1234-5678"
        />
        <TextField
          label="카톡 채널 URL (선택)"
          value={form.kakaoUrl ?? ""}
          onChange={(v) => setField("kakaoUrl", v)}
          placeholder="https://pf.kakao.com/_..."
        />
        <TextField
          label="이메일 (선택)"
          value={form.email ?? ""}
          onChange={(v) => setField("email", v)}
          placeholder="owner@example.com"
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>영업시간</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="평일"
            value={form.hours?.weekdays ?? ""}
            onChange={(v) => setHours("weekdays", v)}
            placeholder="10:00 ~ 18:00"
          />
          <TextField
            label="토요일"
            value={form.hours?.saturday ?? ""}
            onChange={(v) => setHours("saturday", v)}
            placeholder="10:00 ~ 17:00"
          />
          <TextField
            label="일요일"
            value={form.hours?.sunday ?? ""}
            onChange={(v) => setHours("sunday", v)}
            placeholder="휴무"
          />
          <TextField
            label="공휴일"
            value={form.hours?.holiday ?? ""}
            onChange={(v) => setHours("holiday", v)}
            placeholder="휴무"
          />
        </div>
        <TextField
          label="비고 (선택)"
          value={form.hours?.note ?? ""}
          onChange={(v) => setHours("note", v)}
          placeholder="명절 연휴 휴무"
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>주소</SectionTitle>
        <TextField
          label="도로명 주소"
          required
          value={form.address?.full ?? ""}
          onChange={(v) => setAddress("full", v)}
          placeholder="서울시 마포구 연남로 123"
        />
        <TextField
          label="상세 주소 (선택)"
          value={form.address?.detail ?? ""}
          onChange={(v) => setAddress("detail", v)}
          placeholder="2층"
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>사업자 정보</SectionTitle>
        <TextField
          label="사업자등록번호"
          required
          value={form.businessNumber ?? ""}
          onChange={(v) => setField("businessNumber", v)}
          placeholder="123-45-67890"
        />
        <TextField
          label="통신판매업 신고번호"
          value={form.ecommerceLicense ?? ""}
          onChange={(v) => setField("ecommerceLicense", v)}
          hint="D2C 업종은 필수, 다른 업종은 선택"
          placeholder="제 2026-서울마포-1234호"
        />
      </section>

      {saved && (
        <p className="text-[12px] text-success bg-success-soft px-3 py-2 rounded">
          {saved}
        </p>
      )}
      {error && (
        <p className="text-[12px] text-danger bg-danger-soft px-3 py-2 rounded">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="w-full px-4 py-2.5 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium">
      {children}
    </h3>
  );
}

function TextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] text-fg-secondary mb-1">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
      />
      {hint && <p className="mt-1 text-[10px] text-fg-tertiary">{hint}</p>}
    </label>
  );
}
