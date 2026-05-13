"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../_actions/login";

const initialState: LoginState = {};

export function LoginForm({ from }: { from?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from ?? "/admin/tasks"} />
      <div>
        <label
          htmlFor="email"
          className="block text-[11px] text-fg-secondary mb-1"
        >
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-[11px] text-fg-secondary mb-1"
        >
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
        />
      </div>
      {state.error && (
        <p className="text-[11px] text-danger flex items-center gap-1">
          ⚠ {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
