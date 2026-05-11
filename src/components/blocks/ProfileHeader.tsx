import type {
  Block,
  ProfileHeaderConfig,
  ProfileHeaderContent,
} from "@/lib/types";

type Props = Block<ProfileHeaderConfig, ProfileHeaderContent>;

const shapeClass: Record<ProfileHeaderConfig["logoShape"], string> = {
  circle: "rounded-full",
  square: "rounded-md",
  rounded: "rounded-2xl",
};

export function ProfileHeader({ config, content }: Props) {
  const isCentered = config.layout === "centered";
  const hasLogo = Boolean(content.logoUrl);
  const initial = content.title.charAt(0);

  return (
    <header
      className={`px-5 pt-8 pb-7 ${isCentered ? "text-center" : "text-left"}`}
      style={{
        background:
          "linear-gradient(180deg, var(--brand-light) 0%, var(--color-bg-primary) 100%)",
      }}
    >
      <div
        className={`flex ${
          isCentered
            ? "flex-col items-center gap-3"
            : "flex-row items-center gap-3"
        }`}
      >
        {hasLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={content.logoUrl}
            alt={content.title}
            className={`w-16 h-16 object-cover ${shapeClass[config.logoShape]}`}
          />
        ) : (
          <div
            aria-hidden
            className={`w-16 h-16 flex items-center justify-center bg-[var(--brand-primary)] text-[var(--brand-primary-text)] text-[26px] font-medium ${shapeClass[config.logoShape]}`}
          >
            {initial}
          </div>
        )}
        <div className={isCentered ? "" : "min-w-0"}>
          <h1 className="text-[18px] font-medium leading-tight text-fg">
            {content.title}
          </h1>
          {config.showTagline && content.tagline && (
            <p className="mt-1 text-[12px] leading-relaxed text-fg-secondary">
              {content.tagline}
            </p>
          )}
          {content.badge && (
            <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-sm bg-[var(--brand-tint)] text-[var(--brand-primary)] font-medium">
              {content.badge}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
