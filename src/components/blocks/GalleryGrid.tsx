import type { Block } from "@/lib/types";
import { SectionTitle } from "./SectionTitle";

interface Image {
  url: string;
  caption?: string;
  alt?: string;
}

interface Config {
  layout: "grid_2col" | "grid_3col" | "masonry" | "carousel";
  aspectRatio: "square" | "portrait" | "landscape" | "original";
  showCaption: boolean;
  enableLightbox: boolean;
}
interface Content {
  title?: string;
  images: Image[];
}

type Props = Block<Config, Content>;

const aspectClass: Record<Config["aspectRatio"], string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  original: "",
};

const fallbackGradient = [
  "linear-gradient(135deg, var(--brand-light) 0%, var(--brand-accent) 100%)",
  "linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 100%)",
  "linear-gradient(135deg, #d6f0ef 0%, #b8e5e0 100%)",
  "linear-gradient(135deg, #f5c5b8 0%, #e89380 100%)",
  "linear-gradient(135deg, #c7b8f0 0%, #8e86e3 100%)",
  "linear-gradient(135deg, #b8e0a8 0%, #7cb370 100%)",
];

function ImgTile({
  image,
  index,
  aspect,
  showCaption,
}: {
  image: Image;
  index: number;
  aspect: string;
  showCaption: boolean | undefined;
}) {
  // 명시적 false 아니면 캡션 표시 (기본: 캡션 있으면 보여줌)
  const shouldShow = showCaption !== false;
  const hasImg = Boolean(image.url);
  return (
    <figure className="overflow-hidden rounded-md">
      <div
        className={`relative ${aspect} overflow-hidden`}
        style={
          hasImg
            ? undefined
            : { background: fallbackGradient[index % fallbackGradient.length] }
        }
      >
        {hasImg ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image.url}
            alt={image.alt ?? image.caption ?? ""}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[10px] uppercase tracking-wider">
            no image
          </div>
        )}
      </div>
      {shouldShow && image.caption && (
        <figcaption className="mt-1.5 px-1 text-[11px] text-fg-tertiary">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function GalleryGrid({ config, content }: Props) {
  const images = content.images ?? [];
  if (images.length === 0) return null;
  const aspect = aspectClass[config.aspectRatio];

  return (
    <section className="px-5 py-7">
      {content.title && <SectionTitle title={content.title} className="mb-4" />}

      {config.layout === "masonry" ? (
        <div className="columns-2 gap-2 [&>figure]:mb-2 [&>figure]:break-inside-avoid">
          {images.map((img, i) => (
            <ImgTile
              key={i}
              image={img}
              index={i}
              aspect={aspect}
              showCaption={config.showCaption}
            />
          ))}
        </div>
      ) : config.layout === "carousel" ? (
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory -mx-5 px-5">
          {images.map((img, i) => (
            <div
              key={i}
              className="shrink-0 w-3/4 snap-start"
            >
              <ImgTile
                image={img}
                index={i}
                aspect={aspect}
                showCaption={config.showCaption}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={
            config.layout === "grid_3col"
              ? "grid grid-cols-3 gap-2"
              : "grid grid-cols-2 gap-2"
          }
        >
          {images.map((img, i) => (
            <ImgTile
              key={i}
              image={img}
              index={i}
              aspect={aspect}
              showCaption={config.showCaption}
            />
          ))}
        </div>
      )}
    </section>
  );
}
