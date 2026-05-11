import type {
  Block,
  BrandStoryConfig,
  BrandStoryContent,
} from "@/lib/types";
import { SectionTitle } from "./SectionTitle";

type Props = Block<BrandStoryConfig, BrandStoryContent>;

export function BrandStory({ config, content }: Props) {
  const paragraphs = content.body.split(/\n\s*\n/);
  const alignClass = config.textAlign === "center" ? "text-center" : "text-left";
  const widthClass =
    config.maxWidth === "wide" ? "max-w-[80ch]" : "max-w-[60ch]";

  return (
    <section className="px-5 py-7">
      <div className={`${widthClass} mx-auto ${alignClass}`}>
        {content.title && (
          <SectionTitle title={content.title} className="mb-4" />
        )}
        <div className="space-y-3 text-[13px] leading-relaxed text-fg-secondary">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {content.quote && (
          <blockquote className="mt-5 pl-3 border-l-2 border-[var(--brand-primary)] text-[13px] italic text-fg">
            “{content.quote.text}”
            {content.quote.author && (
              <footer className="mt-1 text-[11px] text-fg-tertiary not-italic">
                — {content.quote.author}
              </footer>
            )}
          </blockquote>
        )}
      </div>
    </section>
  );
}
