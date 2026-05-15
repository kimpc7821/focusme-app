"use client";

import { useState } from "react";

export function InquiryForm() {
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessName.trim() || !phone.trim() || !message.trim()) {
      setError("상호명·전화번호·문의 내용을 모두 입력해주세요");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/v1/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName, phone, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(json?.error?.message ?? `전송 실패 (HTTP ${res.status})`);
        return;
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (status === "done") {
    return (
      <div className="text-center py-6">
        <p className="text-[14px] font-medium text-fg">
          문의가 접수되었습니다.
        </p>
        <p className="mt-2 text-[12px] text-fg-tertiary leading-relaxed">
          영업일 기준 빠르게 연락드리겠습니다.
          <br />
          감사합니다.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="block text-[11px] text-fg-secondary mb-1">
          상호명<span className="text-danger ml-0.5">*</span>
        </span>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="노을공방"
          className={inputCls}
          required
        />
      </label>
      <label className="block">
        <span className="block text-[11px] text-fg-secondary mb-1">
          전화번호<span className="text-danger ml-0.5">*</span>
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          placeholder="010-1234-5678"
          className={inputCls}
          required
        />
      </label>
      <label className="block">
        <span className="block text-[11px] text-fg-secondary mb-1">
          문의 내용<span className="text-danger ml-0.5">*</span>
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="어떤 사업이신지, 어떤 페이지를 원하시는지 간단히 적어주세요."
          className={`${inputCls} resize-y leading-relaxed`}
          required
        />
      </label>

      {error && (
        <p className="text-[11px] text-danger bg-danger-soft px-3 py-2 rounded">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-2.5 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? "전송 중..." : "문의하기"}
      </button>
    </form>
  );
}
