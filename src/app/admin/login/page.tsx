import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm bg-bg rounded-xl shadow-sm border border-border-default p-7">
        <div className="text-center mb-6">
          <h1 className="text-[18px] font-medium text-fg">FocusMe Admin</h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            직원 로그인
          </p>
        </div>
        <LoginForm from={next} />
      </div>
    </div>
  );
}
