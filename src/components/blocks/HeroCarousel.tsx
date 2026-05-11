import type {
  Block,
  HeroCarouselConfig,
  HeroCarouselContent,
} from "@/lib/types";

type Props = Block<HeroCarouselConfig, HeroCarouselContent>;

const aspectClass: Record<HeroCarouselConfig["layout"], string> = {
  fullscreen: "aspect-[3/4] md:aspect-[16/9]",
  aspect_16_9: "aspect-[16/9]",
  aspect_4_5: "aspect-[4/5]",
};

export function HeroCarousel({ config, content }: Props) {
  // MVP: 첫 슬라이드만 정적 렌더 (캐러셀 인터랙션은 후속)
  const slide = content.slides[0];
  if (!slide) return null;
  const hasImage = Boolean(slide.imageUrl);

  return (
    <section className="w-full">
      <div
        className={`relative w-full overflow-hidden ${aspectClass[config.layout]}`}
        style={
          hasImage
            ? undefined
            : {
                background:
                  "linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 45%, color-mix(in srgb, var(--brand-primary) 80%, black) 100%)",
              }
        }
      >
        {hasImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt={slide.title ?? ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {config.overlay !== "none" && (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.45) 100%)",
                }}
              />
            )}
          </>
        )}

        {!hasImage && (
          /* 부드러운 광점 (orb) — 따뜻한 깊이감 */
          <>
            <div
              aria-hidden
              className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full opacity-50"
              style={{
                background: "rgba(255, 255, 255, 0.35)",
                filter: "blur(40px)",
              }}
            />
            <div
              aria-hidden
              className="absolute bottom-[20px] left-[-30px] w-32 h-32 rounded-full opacity-40"
              style={{
                background: "rgba(255, 200, 120, 0.5)",
                filter: "blur(40px)",
              }}
            />
          </>
        )}

        {(slide.title || slide.subtitle) && (
          <div className="absolute inset-x-5 bottom-6 text-fg-inverse text-left z-[2]">
            {slide.title && (
              <h2 className="text-[24px] font-medium leading-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.2)]">
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p className="mt-1 text-[13px] opacity-95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
                {slide.subtitle}
              </p>
            )}
          </div>
        )}

        {config.showIndicators && content.slides.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-[2]">
            {content.slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === 0 ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
