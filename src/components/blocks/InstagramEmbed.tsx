import type { Block } from "@/lib/types";

interface Config {
  layout: "card" | "minimal";
  showCaption: boolean;
}
interface Content {
  postUrl: string;
  postId?: string;
  cachedImageUrl?: string;
  cachedCaption?: string;
}

type Props = Block<Config, Content>;

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstagramEmbed({ config, content }: Props) {
  if (!content.postUrl) return null;

  const inner = (
    <>
      <div
        className="relative aspect-square overflow-hidden"
        style={
          content.cachedImageUrl
            ? undefined
            : {
                background:
                  "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              }
        }
      >
        {content.cachedImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={content.cachedImageUrl}
            alt={content.cachedCaption ?? "Instagram post"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <InstagramIcon size={56} />
          </div>
        )}
        <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bg/90 text-fg flex items-center justify-center">
          <InstagramIcon size={14} />
        </span>
      </div>
      {config.showCaption && content.cachedCaption && (
        <p className="px-3 py-2 text-[12px] text-fg-secondary leading-relaxed line-clamp-3">
          {content.cachedCaption}
        </p>
      )}
    </>
  );

  if (config.layout === "minimal") {
    return (
      <section className="px-5 py-5">
        <a
          href={content.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md overflow-hidden hover:opacity-90 transition-opacity"
        >
          {inner}
        </a>
      </section>
    );
  }

  return (
    <section className="px-5 py-5">
      <a
        href={content.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md overflow-hidden border border-border-default hover:shadow-md transition-shadow"
      >
        {inner}
        <div className="px-3 py-2 text-[11px] text-fg-tertiary border-t border-border-default flex items-center gap-1.5">
          <InstagramIcon size={12} />
          <span>Instagram 에서 보기 →</span>
        </div>
      </a>
    </section>
  );
}
