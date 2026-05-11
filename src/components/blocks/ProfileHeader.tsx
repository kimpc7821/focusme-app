import type {
  Block,
  ProfileHeaderConfig,
  ProfileHeaderContent,
} from "@/lib/types";

type Props = Block<ProfileHeaderConfig, ProfileHeaderContent>;

const shapeClass: Record<ProfileHeaderConfig["logoShape"], string> = {
  circle: "rounded-full",
  square: "rounded-none",
  rounded: "rounded-lg",
};

export function ProfileHeader({ config, content }: Props) {
  const isCentered = config.layout === "centered";

  return (
    <header
      className={`px-5 pt-7 pb-5 ${
        isCentered ? "text-center" : "text-left"
      } bg-[var(--brand-light)]`}
    >
      <div
        className={`flex ${
          isCentered ? "flex-col items-center" : "flex-row items-center gap-3"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.logoUrl}
          alt={content.title}
          className={`w-16 h-16 object-cover ${shapeClass[config.logoShape]}`}
        />
        <div className={isCentered ? "mt-3" : ""}>
          <h1 className="text-[18px] font-medium leading-tight text-fg">
            {content.title}
          </h1>
          {config.showTagline && content.tagline && (
            <p className="mt-1 text-[12px] leading-relaxed text-fg-secondary">
              {content.tagline}
            </p>
          )}
          {content.badge && (
            <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-sm bg-info-soft text-info font-medium">
              {content.badge}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
