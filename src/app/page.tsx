import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-[480px] px-5 py-12">
      <div className="text-center">
        <h1 className="text-[22px] font-medium leading-tight text-fg">
          FocusMe
        </h1>
        <p className="mt-2 text-[13px] text-fg-secondary">
          사장님 사업에 포커스 — 모바일 마이크로사이트
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-[10px] uppercase tracking-wider text-fg-tertiary mb-3 font-medium">
          데모 페이지
        </h2>
        <ul className="space-y-2">
          <li>
            <Link
              href="/p/noeul"
              className="block px-4 py-3 rounded-md border border-border-default bg-bg hover:bg-bg-soft transition-colors"
            >
              <div className="text-[13px] font-medium text-fg">노을공방</div>
              <div className="text-[11px] text-fg-tertiary mt-0.5">
                D2C · warm_minimal · /p/noeul
              </div>
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[10px] uppercase tracking-wider text-fg-tertiary mb-3 font-medium">
          진행 상황
        </h2>
        <ul className="space-y-1 text-[12px] text-fg-secondary">
          <li>✓ Next.js + Tailwind + 디자인 토큰</li>
          <li>✓ 블록 6개 (header · hero · story · products · info · cta)</li>
          <li>· 다음: 나머지 9개 블록 → Supabase 연결 → API</li>
        </ul>
      </section>
    </main>
  );
}
