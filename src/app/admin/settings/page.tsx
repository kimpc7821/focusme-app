import { getAdminSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "설정 | FocusMe Admin" };

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <h1 className="text-[22px] font-medium text-fg leading-tight">설정</h1>
      <p className="mt-1 text-[12px] text-fg-tertiary">
        {session.name} · {session.email}
      </p>

      <section className="mt-6 bg-bg rounded-lg border border-border-default p-5">
        <h2 className="text-[13px] font-medium text-fg mb-1">
          비밀번호 변경
        </h2>
        <p className="text-[11px] text-fg-tertiary mb-4">
          분실 시: 본인 PC 에서{" "}
          <code className="font-mono">
            node scripts/admin-password.mjs {session.email} 새비번
          </code>{" "}
          실행으로 자가 복구.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
