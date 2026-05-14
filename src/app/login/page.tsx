import { LoginPanel } from "./LoginPanel";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function ClientLoginPage({ searchParams }: Props) {
  const { from } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm bg-bg rounded-xl shadow-sm border border-border-default p-7">
        <div className="text-center mb-6">
          <h1 className="text-[20px] font-medium text-fg">FocusMe</h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            사장님 사업에 포커스 — 한 페이지로
          </p>
        </div>
        <LoginPanel from={from} />
      </div>
    </div>
  );
}
