"use client";

import { useActionState, useState } from "react";
import {
  kakaoLoginAction,
  smsRequestAction,
  smsVerifyAction,
  passwordLoginAction,
  type KakaoLoginState,
  type SmsRequestState,
  type SmsVerifyState,
  type PasswordLoginState,
} from "@/app/me/_actions/auth";

type Tab = "kakao" | "sms";

// v2: id(휴대폰)/pw 단일. 아래 둘은 후순위 — true 로 바꾸면 부활.
//  - 카카오 로그인: v1.1
//  - SMS 인증: NHN Toast 연동 후
const ENABLE_KAKAO_LOGIN = false;
const ENABLE_SMS_LOGIN = false;

const initialKakao: KakaoLoginState = {};
const initialSmsReq: SmsRequestState = {};
const initialSmsVerify: SmsVerifyState = {};
const initialPwLogin: PasswordLoginState = {};

export function LoginPanel({ from }: { from?: string }) {
  const [tab, setTab] = useState<Tab>(ENABLE_KAKAO_LOGIN ? "kakao" : "sms");
  const safeFrom = from ?? "/me";

  // 기본: id/pw 폼만. (SMS·카카오 휴면)
  if (!ENABLE_KAKAO_LOGIN && !ENABLE_SMS_LOGIN) {
    return (
      <div>
        <PasswordForm from={safeFrom} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex border-b border-border-default mb-5 text-[12px]">
        <TabButton active={tab === "kakao"} onClick={() => setTab("kakao")}>
          카카오
        </TabButton>
        <TabButton active={tab === "sms"} onClick={() => setTab("sms")}>
          휴대폰
        </TabButton>
      </div>

      {tab === "kakao" ? (
        <KakaoForm from={safeFrom} />
      ) : (
        <SmsForm from={safeFrom} />
      )}
    </div>
  );
}

function PasswordForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState(
    passwordLoginAction,
    initialPwLogin,
  );

  const inputCls =
    "w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg";

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="from" value={from} />
      <div>
        <label className="block text-[11px] text-fg-secondary mb-1">
          휴대폰 번호 (아이디)
        </label>
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          defaultValue={state.phone ?? ""}
          placeholder="010-1234-5678"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-[11px] text-fg-secondary mb-1">
          비밀번호
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="발급받은 비밀번호"
          className={inputCls}
        />
      </div>
      {state.error && (
        <p className="text-[11px] text-danger bg-danger-soft px-3 py-2 rounded">
          ⚠ {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-[10px] text-fg-tertiary text-center mt-2 leading-relaxed">
        비밀번호는 페이지 개설 시 발급됩니다. 분실 시 담당 직원에게 문의하세요.
      </p>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 -mb-px border-b-2 transition-colors ${
        active
          ? "border-fg text-fg font-medium"
          : "border-transparent text-fg-tertiary hover:text-fg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function KakaoForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState(kakaoLoginAction, initialKakao);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="from" value={from} />
      <div>
        <label className="block text-[11px] text-fg-secondary mb-1">
          카카오 access token (개발용 mock)
        </label>
        <input
          name="kakaoAccessToken"
          required
          placeholder="mock_<kakaoId>:<닉네임>"
          autoComplete="off"
          className="w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
        />
        <p className="mt-1 text-[10px] text-fg-tertiary">
          예: <code className="font-mono">mock_noeul_test:노을사장</code>
        </p>
      </div>
      {state.error && (
        <p className="text-[11px] text-danger">⚠ {state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-md bg-[#FEE500] text-[#3C1E1E] text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "카카오로 로그인"}
      </button>
      <p className="text-[10px] text-fg-tertiary text-center mt-2">
        실 카카오 SDK 연결은 키 등록 후 KAKAO_PROVIDER=real 로 스위치.
      </p>
    </form>
  );
}

function SmsForm({ from }: { from: string }) {
  const [reqState, requestAction, reqPending] = useActionState(
    smsRequestAction,
    initialSmsReq,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    smsVerifyAction,
    initialSmsVerify,
  );

  // 발송 단계 완료되면 verifyState 의 requestId/phone 도 같이 보존되도록.
  const requestId = verifyState.requestId ?? reqState.requestId;
  const phone = verifyState.phone ?? reqState.phone;
  const devCode = reqState.devCode;
  const showVerifyStep = Boolean(requestId && phone);

  return (
    <div className="space-y-3">
      <form action={requestAction} className="space-y-3">
        <div>
          <label className="block text-[11px] text-fg-secondary mb-1">
            휴대폰 번호
          </label>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            required
            defaultValue={phone ?? ""}
            placeholder="010-1234-5678"
            className="w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
          />
        </div>
        {reqState.error && (
          <p className="text-[11px] text-danger">⚠ {reqState.error}</p>
        )}
        <button
          type="submit"
          disabled={reqPending}
          className="w-full py-2 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft disabled:opacity-50"
        >
          {reqPending
            ? "발송 중..."
            : showVerifyStep
              ? "인증번호 재발송"
              : "인증번호 받기"}
        </button>
      </form>

      {showVerifyStep && (
        <form action={verifyAction} className="space-y-3 pt-3 border-t border-border-default">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="from" value={from} />
          <div>
            <label className="block text-[11px] text-fg-secondary mb-1">
              인증번호 (6자리)
            </label>
            <input
              name="code"
              required
              inputMode="numeric"
              maxLength={6}
              autoFocus
              defaultValue={devCode ?? ""}
              placeholder="------"
              className="w-full px-3 py-2.5 text-[15px] font-mono tracking-widest text-center rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
            />
            {devCode && (
              <p className="mt-1 text-[10px] text-fg-tertiary">
                개발 모드: 인증번호 <code className="font-mono">{devCode}</code> 자동입력
              </p>
            )}
          </div>
          {verifyState.error && (
            <p className="text-[11px] text-danger">⚠ {verifyState.error}</p>
          )}
          <button
            type="submit"
            disabled={verifyPending}
            className="w-full py-2.5 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {verifyPending ? "확인 중..." : "확인하고 로그인"}
          </button>
        </form>
      )}
    </div>
  );
}
