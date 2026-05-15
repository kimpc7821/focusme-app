"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/app/me/_actions/auth";

const initial: ChangePasswordState = {};

export function ChangePasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initial,
  );

  const inputCls =
    "w-full px-3 py-2.5 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg";

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="block text-[11px] text-fg-secondary mb-1">
          새 비밀번호 (8자 이상)
        </span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="block text-[11px] text-fg-secondary mb-1">
          새 비밀번호 확인
        </span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
      </label>
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
        {pending ? "변경 중..." : "비밀번호 변경하고 계속"}
      </button>
    </form>
  );
}
