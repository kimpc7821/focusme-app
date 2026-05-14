import Link from "next/link";

interface DemoPage {
  slug: string;
  title: string;
  businessType: string;
  toneKey: string;
  toneColor: string;
}

const DEMOS: DemoPage[] = [
  {
    slug: "noeul",
    title: "노을공방",
    businessType: "D2C 핸드메이드",
    toneKey: "warm_minimal",
    toneColor: "#EF9F27",
  },
  {
    slug: "greengolf",
    title: "그린골프 인도어",
    businessType: "인도어 골프",
    toneKey: "cool_modern",
    toneColor: "#185FA5",
  },
  {
    slug: "haruspace",
    title: "하루공간",
    businessType: "인테리어",
    toneKey: "premium_dark",
    toneColor: "#2C2C2A",
  },
  {
    slug: "mayflower-cafe",
    title: "오월의 카페",
    businessType: "카페",
    toneKey: "soft_pastel",
    toneColor: "#D4537E",
  },
  {
    slug: "gunwoo-cars",
    title: "김건우 자동차",
    businessType: "자동차 영업",
    toneKey: "vivid_bold",
    toneColor: "#DC2626",
  },
  {
    slug: "hanyeoldang",
    title: "한열당 한의원",
    businessType: "한의원",
    toneKey: "warm_minimal",
    toneColor: "#EF9F27",
  },
  {
    slug: "park-laborlaw",
    title: "박정현 노무사",
    businessType: "1인 전문직 (노무)",
    toneKey: "cool_modern",
    toneColor: "#185FA5",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
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
          데모 페이지 · 7업종 · 5톤 라이브러리
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/p/${d.slug}`}
                className="block px-4 py-3 rounded-md border border-border-default bg-bg hover:bg-bg-soft transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: d.toneColor }}
                  />
                  <div className="text-[13px] font-medium text-fg">
                    {d.title}
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-fg-tertiary font-mono pl-5">
                  {d.businessType} · {d.toneKey} · /p/{d.slug}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          href="/login"
          className="block px-4 py-3 rounded-md border border-border-default bg-bg hover:bg-bg-soft transition-colors"
        >
          <div className="text-[13px] font-medium text-fg">사장님 로그인</div>
          <div className="mt-1 text-[11px] text-fg-tertiary">
            내 페이지 · 자료 수정 · QR 발급
          </div>
        </Link>
        <Link
          href="/admin/tasks"
          className="block px-4 py-3 rounded-md border border-border-default bg-bg hover:bg-bg-soft transition-colors"
        >
          <div className="text-[13px] font-medium text-fg">FocusMe Admin</div>
          <div className="mt-1 text-[11px] text-fg-tertiary">
            작업 큐 · 페이지 편집기 · AI 재생성
          </div>
        </Link>
      </section>
    </main>
  );
}
