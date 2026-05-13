import type { Block } from "@/lib/types";

interface Config {
  provider: "naver" | "kakao" | "google";
  height: "small" | "medium" | "large";
  showDirectionsButton: boolean;
  zoom: number;
}
interface Content {
  latitude?: number;
  longitude?: number;
  address?: string;
  placeName?: string;
  directionsUrl?: string;
}

type Props = Block<Config, Content>;

const heightClass: Record<Config["height"], string> = {
  small: "h-48",
  medium: "h-64",
  large: "h-80",
};

function PinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function buildDirectionsUrl(content: Content, provider: Config["provider"]): string | null {
  if (content.directionsUrl) return content.directionsUrl;
  const q = encodeURIComponent(content.placeName ?? content.address ?? "");
  if (!q && (!content.latitude || !content.longitude)) return null;
  if (provider === "naver") {
    return `https://map.naver.com/p/search/${q}`;
  }
  if (provider === "kakao") {
    return `https://map.kakao.com/?q=${q}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function Map({ config, content }: Props) {
  const url = buildDirectionsUrl(content, config.provider);

  return (
    <section className="px-5 py-5">
      <div
        className={`relative ${heightClass[config.height]} w-full rounded-lg overflow-hidden`}
        style={{
          background: "linear-gradient(135deg, #D6F0EF 0%, #B8E5E0 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md"
            style={{
              background: "var(--brand-primary)",
              color: "var(--brand-primary-text)",
            }}
          >
            <PinIcon size={18} />
          </div>
        </div>
        {content.placeName && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-bg/90 text-[12px] font-medium text-fg">
            {content.placeName}
          </div>
        )}
        {config.showDirectionsButton && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-md bg-bg text-fg text-[12px] font-medium hover:bg-bg-soft transition-colors shadow-sm"
          >
            길찾기 →
          </a>
        )}
      </div>
      {content.address && (
        <p className="mt-2 px-1 text-[12px] text-fg-secondary leading-relaxed">
          {content.address}
        </p>
      )}
    </section>
  );
}
