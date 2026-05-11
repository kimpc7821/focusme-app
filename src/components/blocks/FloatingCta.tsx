import type {
  Block,
  FloatingCtaConfig,
  FloatingCtaContent,
} from "@/lib/types";

type Props = Block<FloatingCtaConfig, FloatingCtaContent>;

const sizeClass: Record<FloatingCtaConfig["buttonSize"], string> = {
  small: "w-11 h-11 text-[11px]",
  medium: "w-13 h-13 text-[12px]",
  large: "w-15 h-15 text-[13px]",
};

const positionClass: Record<FloatingCtaConfig["position"], string> = {
  right_bottom: "right-4 bottom-4 items-end",
  left_bottom: "left-4 bottom-4 items-start",
};

function buttonHref(type: string, value: string): string {
  if (type === "phone") return `tel:${value}`;
  if (type === "kakao" || type === "external") return value;
  if (type === "message") return `sms:${value}`;
  return value;
}

function buttonIcon(type: string) {
  if (type === "phone") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  // kakao / message / external — 동일한 chat 아이콘
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function FloatingCta({ config, content }: Props) {
  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClass[config.position]}`}
    >
      {content.buttons.map((btn, i) => (
        <a
          key={i}
          href={buttonHref(btn.type, btn.value)}
          target={btn.type === "kakao" || btn.type === "external" ? "_blank" : undefined}
          rel="noopener noreferrer"
          aria-label={btn.label}
          className={`${sizeClass[config.buttonSize]} rounded-full flex items-center justify-center bg-[var(--brand-primary)] text-[var(--brand-primary-text)] shadow-lg active:scale-95 transition-transform`}
        >
          {buttonIcon(btn.type)}
        </a>
      ))}
    </div>
  );
}
