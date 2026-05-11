import type {
  Block,
  ProductCardsConfig,
  ProductCardsContent,
} from "@/lib/types";

type Props = Block<ProductCardsConfig, ProductCardsContent>;

const gridClass: Record<ProductCardsConfig["layout"], string> = {
  grid_2col: "grid grid-cols-2 gap-2",
  grid_3col: "grid grid-cols-3 gap-2",
  horizontal_scroll: "flex gap-2 overflow-x-auto snap-x snap-mandatory",
};

export function ProductCards({ config, content }: Props) {
  return (
    <section className="px-5 py-7 bg-bg-soft">
      {content.title && (
        <h2 className="text-[17px] font-medium leading-tight text-fg mb-4">
          {content.title}
        </h2>
      )}
      <div className={gridClass[config.layout]}>
        {content.products.map((product, i) => {
          const isLink = Boolean(product.url);
          const Card = isLink ? "a" : "div";
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
              className={`block bg-bg rounded-md overflow-hidden border border-border-default ${
                config.layout === "horizontal_scroll"
                  ? "shrink-0 w-40 snap-start"
                  : ""
              } ${isLink ? "active:opacity-70 transition-opacity" : ""}`}
            >
              {product.imageUrl && (
                <div className="relative aspect-square bg-bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {product.badge && (
                    <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-sm bg-[var(--brand-primary)] text-[var(--brand-primary-text)] font-medium">
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
              )}
              <div className="p-3">
                <p className="text-[13px] font-medium text-fg leading-snug">
                  {product.name}
                </p>
                {config.showDescription && product.description && (
                  <p className="mt-1 text-[11px] text-fg-secondary leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                )}
                {config.showPrice && product.price && (
                  <p className="mt-1 text-[13px] font-medium text-[var(--brand-primary)]">
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
