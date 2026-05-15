"use client";

import { useActionState } from "react";
import { createPageAction, type CreatePageState } from "../../_actions/pages";

interface Props {
  templates: Array<{
    key: string;
    name: string;
    description: string | null;
    recommended_tone: string | null;
  }>;
  tones: Array<{
    key: string;
    name: string;
    description: string | null;
    preview: unknown;
  }>;
}

const initialState: CreatePageState = {};

export function NewPageForm({ templates, tones }: Props) {
  const [state, formAction, isPending] = useActionState<CreatePageState, FormData>(
    createPageAction,
    initialState,
  );

  if (state.created) {
    const c = state.created;
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success bg-success-soft p-5">
          <p className="text-[14px] font-medium text-fg">
            클라이언트가 등록되었습니다.
          </p>
          <p className="mt-1 text-[12px] text-fg-secondary">
            아래 정보를 사장님께 전달하세요. (NHN 알림톡 미연동 — 직원이 직접
            카톡/문자로 전달)
          </p>

          <div className="mt-4 space-y-2 text-[13px]">
            <CredRow label="로그인 주소" value={c.loginUrl} />
            <CredRow label="아이디 (휴대폰)" value={c.phone} />
            {c.tempPassword ? (
              <CredRow
                label="임시 비밀번호"
                value={c.tempPassword}
                emphasize
              />
            ) : (
              <p className="text-[12px] text-fg-tertiary">
                기존 사장님 계정 — 기존 비밀번호 사용 (임시 pw 미발급)
              </p>
            )}
          </div>
          <p className="mt-2 text-[11px] text-fg-tertiary">
            사장님이 로그인하면 본인 페이지 카드에서 "자료 입력" 으로
            들어갑니다 (페이지별 링크 불필요).
          </p>

          {c.tempPassword && (
            <p className="mt-3 text-[11px] text-fg-tertiary leading-relaxed">
              ⚠ 임시 비밀번호는 이 화면에서만 보입니다 (새로고침 시 사라짐).
              사장님 첫 로그인 시 비밀번호를 강제로 변경하게 됩니다. 분실 시
              클라이언트 목록에서 재발급하세요.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <a
            href="/admin/pages/new"
            className="px-4 py-2 rounded-md border border-border-default text-fg text-[13px] hover:bg-bg-soft"
          >
클라이언트 또 등록
          </a>
          <a
            href={c.taskHref}
            className="px-5 py-2 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90"
          >
            작업으로 이동 →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Section title="페이지">
        <Field
          label="슬러그"
          hint="focusme.kr/<여기> · 소문자·숫자·하이픈 3~30자"
          error={state.fieldErrors?.slug}
        >
          <input
            name="slug"
            required
            placeholder="noeul"
            className="input"
          />
        </Field>
        <Field
          label="업종 템플릿"
          hint="기본 추천 톤이 함께 설정됩니다"
          error={state.fieldErrors?.templateType}
        >
          <select name="templateType" required defaultValue="" className="input">
            <option value="" disabled>
              선택…
            </option>
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="톤 (선택)">
          <select name="toneKey" defaultValue="" className="input">
            <option value="">템플릿 기본값 사용</option>
            {tones.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="브랜드 색상 HEX (선택)" hint="예: #EF9F27">
          <input name="brandColor" placeholder="#EF9F27" className="input" />
        </Field>
      </Section>

      <Section title="클라이언트">
        <Field
          label="휴대폰"
          hint="이미 등록된 휴대폰이면 기존 클라이언트로 자동 연결"
          error={state.fieldErrors?.phone}
        >
          <input
            name="phone"
            required
            placeholder="010-0000-0000"
            className="input"
          />
        </Field>
        <Field label="사업자명" error={state.fieldErrors?.businessName}>
          <input
            name="businessName"
            required
            placeholder="노을공방"
            className="input"
          />
        </Field>
        <Field label="이메일 (선택)">
          <input
            name="email"
            type="email"
            placeholder="owner@noeul.example"
            className="input"
          />
        </Field>
      </Section>

      {state.error && (
        <p className="text-[12px] text-danger">⚠ {state.error}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-default">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "등록 중..." : "클라이언트 등록"}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--color-text-primary);
          background: var(--color-bg-secondary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: 6px;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-info-text);
          background: var(--color-bg-primary);
        }
      `}</style>
    </form>
  );
}

function CredRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] text-fg-tertiary w-[120px] shrink-0 pt-0.5">
        {label}
      </span>
      <code
        className={`flex-1 break-all font-mono select-all px-2 py-1 rounded bg-bg border border-border-default ${
          emphasize ? "text-[15px] font-bold text-fg" : "text-[12px] text-fg"
        }`}
      >
        {value}
      </code>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] text-fg-secondary mb-1">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[10px] text-fg-tertiary">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[10px] text-danger">⚠ {error}</p>
      )}
    </div>
  );
}
