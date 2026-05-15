import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth/client-session";
import { ChangePasswordForm } from "./ChangePasswordForm";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export const metadata = { title: "비밀번호 변경 | FocusMe" };

export default async function ChangePasswordPage({ searchParams }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm bg-bg rounded-xl shadow-sm border border-border-default p-7">
        <div className="text-center mb-6">
          <h1 className="text-[20px] font-medium text-fg">비밀번호 변경</h1>
          <p className="mt-1 text-[12px] text-fg-tertiary leading-relaxed">
            임시 비밀번호로 로그인하셨습니다.
            <br />
            새 비밀번호를 설정해주세요.
          </p>
        </div>
        <ChangePasswordForm next={next ?? "/me"} />
      </div>
    </div>
  );
}
