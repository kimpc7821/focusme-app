"use client";

import { useActionState } from "react";
import {
  resetClientPasswordAction,
  type ResetPwState,
} from "../../_actions/clients";

const initial: ResetPwState = {};

export function ResetPasswordButton({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(
    resetClientPasswordAction,
    initial,
  );

  return (
    <div className="mt-3 pt-3 border-t border-border-default">
      {state.tempPassword ? (
        <div className="rounded-md border border-success bg-success-soft p-3">
          <p className="text-[11px] text-fg-secondary mb-1">
            새 임시 비밀번호 (이 화면에서만 표시 — 사장님께 전달)
          </p>
          <code className="text-[15px] font-bold font-mono select-all text-fg">
            {state.tempPassword}
          </code>
          <p className="mt-2 text-[10px] text-fg-tertiary">
            사장님 첫 로그인 시 비밀번호를 강제로 변경하게 됩니다.
          </p>
        </div>
      ) : (
        <form action={action}>
          <input type="hidden" name="clientId" value={clientId} />
          <button
            type="submit"
            disabled={pending}
            className="text-[11px] px-3 py-1.5 rounded-md border border-border-default text-fg hover:bg-bg-soft disabled:opacity-50"
          >
            {pending ? "재발급 중..." : "임시 비밀번호 재발급"}
          </button>
          {state.error && (
            <p className="mt-2 text-[11px] text-danger">⚠ {state.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
