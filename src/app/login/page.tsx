import { LoginPanel } from "./LoginPanel";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function ClientLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm bg-bg rounded-xl shadow-sm border border-border-default p-7">
        <div className="text-center mb-6">
          <h1 className="text-[20px] font-medium text-fg">FocusMe</h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            사장님 사업에 포커스 — 한 페이지로
          </p>
        </div>
        <LoginPanel from={next} />

        <div className="mt-6 pt-5 border-t border-border-default text-center">
          <a
            href="/inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-fg-secondary hover:text-fg underline underline-offset-2"
          >
            FocusMe 페이지가 없으신가요?
          </a>
        </div>
      </div>
    </div>
  );
}
