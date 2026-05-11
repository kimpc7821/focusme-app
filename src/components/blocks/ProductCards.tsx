import type {
  Block,
  ProductCardsConfig,
  ProductCardsContent,
  ProductKind,
} from "@/lib/types";
import { SectionTitle } from "./SectionTitle";

type Props = Block<ProductCardsConfig, ProductCardsContent>;

const gridClass: Record<ProductCardsConfig["layout"], string> = {
  grid_2col: "grid grid-cols-2 gap-3",
  grid_3col: "grid grid-cols-3 gap-2",
  horizontal_scroll: "flex gap-3 overflow-x-auto snap-x snap-mandatory",
};

interface KindStyle {
  gradient: string;
  icon: React.ReactNode;
}

function FlameIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2c-1.5 3-4 5-4 8a4 4 0 0 0 8 0c0-1.5-.5-2.5-1-3.5.8 1 2 2.5 2 4.5a5 5 0 0 1-10 0c0-4 5-6 5-9z" />
    </svg>
  );
}
function FlaskIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 3h6" />
      <path d="M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L14 9V3" />
      <path d="M7 14h10" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9h6v6c0 5-4 9-9 9z" />
      <path d="M2 22 16 8" />
    </svg>
  );
}
function FlowerIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9c1.5-3 4-4 5-3s0 4-3 5" />
      <path d="M12 15c-1.5 3-4 4-5 3s0-4 3-5" />
      <path d="M15 12c3-1.5 4-4 3-5s-4 0-5 3" />
      <path d="M9 12c-3 1.5-4 4-3 5s4 0 5-3" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

const KIND_STYLES: Record<ProductKind, KindStyle> = {
  candle: {
    gradient: "linear-gradient(135deg, #FAC775 0%, #EF9F27 100%)",
    icon: <FlameIcon />,
  },
  diffuser: {
    gradient: "linear-gradient(135deg, #C7B8F0 0%, #8E86E3 100%)",
    icon: <FlaskIcon />,
  },
  plant: {
    gradient: "linear-gradient(135deg, #B8E0A8 0%, #7CB370 100%)",
    icon: <LeafIcon />,
  },
  incense: {
    gradient: "linear-gradient(135deg, #F5C5B8 0%, #E89380 100%)",
    icon: <FlowerIcon />,
  },
  default: {
    gradient: "linear-gradient(135deg, var(--brand-accent), var(--brand-primary))",
    icon: <BagIcon />,
  },
};

function badgeClasses(kind?: "best" | "new" | "limited" | "default"): string {
  if (kind === "new") return "bg-[var(--color-success-strong)] text-white";
  if (kind === "limited")
    return "bg-[var(--color-danger-strong)] text-white";
  // best · default → 브랜드 색
  return "bg-[var(--brand-primary)] text-[var(--brand-primary-text)]";
}

export function ProductCards({ config, content }: Props) {
  return (
    <section className="px-5 py-7">
      {content.title && (
        <SectionTitle title={content.title} className="mb-4" />
      )}
      <div className={gridClass[config.layout]}>
        {content.products.map((product, i) => {
          const isLink = Boolean(product.url);
          const Card = isLink ? "a" : "div";
          const kindStyle = KIND_STYLES[product.fallbackKind ?? "default"];
          const showImage = Boolean(product.imageUrl);

          return (
            <Card
              key={i}
              {...(isLink
                ? {
                    href: product.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : {})}
              className={`block bg-bg rounded-[10px] overflow-hidden border border-border-default transition-all duration-200 ${
                isLink
                  ? "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:opacity-80"
                  : ""
              } ${
                config.layout === "horizontal_scroll"
                  ? "shrink-0 w-40 snap-start"
                  : ""
              }`}
            >
              <div
                className="relative aspect-square overflow-hidden"
                style={showImage ? undefined : { background: kindStyle.gradient }}
              >
                {showImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/90">
                    {kindStyle.icon}
                  </div>
                )}
                {product.badge && (
                  <span
                    className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-[4px] font-medium ${badgeClasses(product.badgeKind)}`}
                  >
                    {product.badge}
                  </span>
                )}
                {product.available === false && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-fg-inverse text-[12px] font-medium">
                      품절
                    </span>
                  </div>
                )}
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <p className="text-[13px] font-medium text-fg leading-snug line-clamp-2">
                  {product.name}
                </p>
                {config.showDescription && product.description && (
                  <p className="mt-1 text-[11px] text-fg-secondary leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                )}
                {config.showPrice && product.price && (
                  <p className="mt-1 text-[14px] font-semibold text-[var(--brand-primary)]">
                    {product.price}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
