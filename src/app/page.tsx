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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="flex items-center justify-end">
        <nav className="flex items-center gap-4 text-[12px]">
          <Link
            href="/login"
            className="text-fg-secondary hover:text-fg transition-colors"
          >
            client 로그인
          </Link>
          <Link
            href="/inquiry"
            className="px-3 py-1.5 rounded-md bg-info text-fg-inverse font-medium hover:opacity-90"
          >
            개설 문의
          </Link>
        </nav>
      </header>

      <div className="text-center mt-16">
        <h1 className="text-[26px] font-medium leading-tight text-fg">
          FocusMe
        </h1>
        <p className="mt-3 text-[14px] text-fg-secondary">
          사장님 사업에 포커스 — 한 페이지로 끝내는 모바일 사이트
        </p>
      </div>

      <section className="mt-14">
        <h2 className="text-[12px] text-fg-tertiary mb-4 text-center">
          이런 페이지를 만들어 드립니다
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEMOS.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/p/${d.slug}`}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-border-default bg-bg hover:bg-bg-soft transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: d.toneColor }}
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-fg truncate">
                    {d.title}
                  </span>
                  <span className="block mt-0.5 text-[11px] text-fg-tertiary">
                    {d.businessType}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 text-center text-[12px] text-fg-tertiary">
        FocusMe 페이지가 필요하신가요?{" "}
        <Link href="/inquiry" className="text-info hover:underline">
          개설 문의하기
        </Link>
      </p>
    </main>
  );
}
