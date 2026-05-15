import type { Block } from "@/lib/types";

type SnsType =
  | "instagram"
  | "blog"
  | "youtube"
  | "tiktok"
  | "naver_place"
  | "naver_cafe"
  | "smartstore"
  | "website"
  | "custom";

interface Item {
  type: SnsType | string; // 미지 type 도 허용 (사장님 자유입력 폼 대비) — 렌더 시 custom fallback
  url: string;
  label?: string;
  icon?: string;
}

const KNOWN_TYPES = new Set<SnsType>([
  "instagram",
  "blog",
  "youtube",
  "tiktok",
  "naver_place",
  "naver_cafe",
  "smartstore",
  "website",
  "custom",
]);

function toKnownType(t: string): SnsType {
  return KNOWN_TYPES.has(t as SnsType) ? (t as SnsType) : "custom";
}

interface Config {
  layout: "grid_2col" | "grid_3col" | "horizontal_scroll";
  iconStyle: "colored" | "monochrome";
  showLabels: boolean;
}
interface Content {
  items: Item[];
}

type Props = Block<Config, Content>;

const DEFAULT_LABEL: Record<SnsType, string> = {
  instagram: "Instagram",
  blog: "블로그",
  youtube: "YouTube",
  tiktok: "TikTok",
  naver_place: "네이버 플레이스",
  naver_cafe: "네이버 카페",
  smartstore: "스마트스토어",
  website: "홈페이지",
  custom: "링크",
};

const COLORED_BG: Record<SnsType, string> = {
  instagram:
    "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
  blog: "#03C75A",
  youtube: "#FF0000",
  tiktok: "#000000",
  naver_place: "#03C75A",
  naver_cafe: "#03C75A",
  smartstore: "#03C75A",
  website: "#185FA5",
  custom: "var(--brand-primary)",
};

function Icon({ type, size = 20 }: { type: SnsType; size?: number }) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };
  switch (type) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.5 7.5a3 3 0 0 0-2.1-2.1C17.6 5 12 5 12 5s-5.6 0-7.4.4A3 3 0 0 0 2.5 7.5C2 9.3 2 12 2 12s0 2.7.5 4.5a3 3 0 0 0 2.1 2.1C6.4 19 12 19 12 19s5.6 0 7.4-.4a3 3 0 0 0 2.1-2.1C22 14.7 22 12 22 12s0-2.7-.5-4.5zM10 15V9l5 3-5 3z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M19 8.5a6.5 6.5 0 0 1-4-1.4v7.4a6 6 0 1 1-5-5.9v3a3 3 0 1 0 2 2.8V3h3a3.5 3.5 0 0 0 4 3v2.5z" />
        </svg>
      );
    case "blog":
    case "naver_place":
    case "naver_cafe":
    case "smartstore":
      // 네이버 N 마크 단순화
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z" />
        </svg>
      );
    case "website":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
      );
    case "custom":
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
      );
  }
}

const layoutClass: Record<Config["layout"], string> = {
  grid_2col: "grid grid-cols-2 gap-2",
  grid_3col: "grid grid-cols-3 gap-2",
  horizontal_scroll: "flex gap-2 overflow-x-auto snap-x snap-mandatory",
};

export function SnsButtons({ config, content }: Props) {
  const items = content.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className="px-5 py-5">
      <div className={layoutClass[config.layout]}>
        {items.map((it, i) => {
          // 미지 type 이 들어오면 custom 으로 매핑 — 아이콘·색·라벨 fallback
          const t = toKnownType(it.type);
          const colored = config.iconStyle === "colored";
          const label = it.label || DEFAULT_LABEL[t];
          return (
            <a
              key={i}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-border-default text-[12px] text-fg hover:bg-bg-soft active:opacity-80 transition-colors ${
                config.layout === "horizontal_scroll"
                  ? "shrink-0 snap-start"
                  : ""
              }`}
            >
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={
                  colored
                    ? {
                        background: COLORED_BG[t],
                        color: t === "tiktok" ? "#fff" : "#fff",
                      }
                    : {
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-text-secondary)",
                      }
                }
              >
                <Icon type={t} />
              </span>
              {config.showLabels && (
                <span className="font-medium truncate">{label}</span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
