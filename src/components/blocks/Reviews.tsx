import type { Block } from "@/lib/types";
import { SectionTitle } from "./SectionTitle";

interface Review {
  text: string;
  rating?: number;
  author?: string;
  date?: string;
  sourceUrl?: string;
}

interface Config {
  layout: "cards_vertical" | "cards_horizontal_scroll" | "quote_style";
  showRating: boolean;
  showAuthor: boolean;
  showDate: boolean;
  maxItems: number;
}
interface Content {
  title?: string;
  reviews: Review[];
}

type Props = Block<Config, Content>;

function Stars({ rating = 5 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-0.5 text-[var(--brand-primary)]"
      aria-label={`${r}/5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < r ? "" : "opacity-30"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  config,
  highlight,
}: {
  review: Review;
  config: Config;
  highlight: boolean;
}) {
  const Component = review.sourceUrl ? "a" : "div";
  const props = review.sourceUrl
    ? { href: review.sourceUrl, target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <Component
      {...props}
      className={`block bg-bg rounded-md border border-border-default p-4 ${
        highlight ? "hover:shadow-md" : ""
      } transition-shadow`}
    >
      {config.showRating && review.rating && (
        <div className="mb-2 text-[14px] leading-none">
          <Stars rating={review.rating} />
        </div>
      )}
      <p className="text-[13px] leading-relaxed text-fg">{review.text}</p>
      {(config.showAuthor || config.showDate) && (
        <p className="mt-2 text-[11px] text-fg-tertiary">
          {config.showAuthor && review.author && (
            <span>— {review.author}</span>
          )}
          {config.showAuthor && config.showDate && review.author && review.date && (
            <span className="mx-1">·</span>
          )}
          {config.showDate && review.date && <span>{review.date}</span>}
        </p>
      )}
    </Component>
  );
}

function QuoteCard({ review, config }: { review: Review; config: Config }) {
  return (
    <blockquote
      className="relative p-4 pl-7"
      style={{ borderLeft: "2px solid var(--brand-primary)" }}
    >
      <span
        aria-hidden
        className="absolute left-2 top-2 text-[28px] leading-none font-serif text-[var(--brand-primary)] opacity-40"
      >
        “
      </span>
      <p className="text-[14px] leading-relaxed text-fg italic">
        {review.text}
      </p>
      {config.showAuthor && review.author && (
        <footer className="mt-2 text-[11px] text-fg-tertiary not-italic">
          — {review.author}
          {config.showDate && review.date && (
            <>
              <span className="mx-1">·</span>
              {review.date}
            </>
          )}
        </footer>
      )}
    </blockquote>
  );
}

export function Reviews({ config, content }: Props) {
  const all = content.reviews ?? [];
  if (all.length === 0) return null;
  const items = all.slice(0, Math.max(1, config.maxItems ?? 3));

  return (
    <section className="px-5 py-7">
      {content.title && <SectionTitle title={content.title} className="mb-4" />}

      {config.layout === "quote_style" ? (
        <div className="space-y-3">
          {items.map((r, i) => (
            <QuoteCard key={i} review={r} config={config} />
          ))}
        </div>
      ) : config.layout === "cards_horizontal_scroll" ? (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-5 px-5">
          {items.map((r, i) => (
            <div key={i} className="shrink-0 w-[85%] snap-start">
              <ReviewCard review={r} config={config} highlight={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((r, i) => (
            <ReviewCard key={i} review={r} config={config} highlight />
          ))}
        </div>
      )}

      {all.length > items.length && (
        <p className="mt-3 text-center text-[11px] text-fg-tertiary">
          + {all.length - items.length}개 후기 더보기
        </p>
      )}
    </section>
  );
}
