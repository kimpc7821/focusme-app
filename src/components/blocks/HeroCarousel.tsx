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

const overlayClass: Record<HeroCarouselConfig["overlay"], string> = {
  none: "",
  dark: "bg-black/30",
  light: "bg-white/20",
  gradient:
    "bg-gradient-to-t from-black/65 via-black/15 to-transparent",
};

const textPosClass: Record<HeroCarouselConfig["textPosition"], string> = {
  top: "items-start pt-6",
  center: "items-center",
  bottom: "items-end pb-6",
};

export function HeroCarousel({ config, content }: Props) {
  // MVP: 첫 슬라이드만 정적 렌더 (캐러셀 인터랙션은 후속)
  const slide = content.slides[0];
  if (!slide) return null;

  return (
    <section className="w-full">
      <div
        className={`relative w-full overflow-hidden ${aspectClass[config.layout]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imageUrl}
          alt={slide.title ?? ""}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {config.overlay !== "none" && (
          <div className={`absolute inset-0 ${overlayClass[config.overlay]}`} />
        )}
        {(slide.title || slide.subtitle) && (
          <div
            className={`relative h-full w-full flex justify-center px-5 ${textPosClass[config.textPosition]}`}
          >
            <div className="text-center text-fg-inverse">
              {slide.title && (
                <h2 className="text-[22px] font-medium leading-tight drop-shadow-sm">
                  {slide.title}
                </h2>
              )}
              {slide.subtitle && (
                <p className="mt-1 text-[13px] opacity-90 drop-shadow-sm">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        {config.showIndicators && content.slides.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
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
