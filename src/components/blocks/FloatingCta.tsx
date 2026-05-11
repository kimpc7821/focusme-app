import type {
  Block,
  FloatingCtaConfig,
  FloatingCtaContent,
} from "@/lib/types";

type Props = Block<FloatingCtaConfig, FloatingCtaContent>;

const sizeClass: Record<FloatingCtaConfig["buttonSize"], string> = {
  small: "w-11 h-11",
  medium: "w-13 h-13",
  large: "w-15 h-15",
};

function buttonHref(type: string, value: string): string {
  if (type === "phone") return `tel:${value}`;
  if (type === "message") return `sms:${value}`;
  return value;
}

function buttonIcon(type: string) {
  if (type === "phone") {
    return (
      <svg
        width="22"
        height="22"
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
  return (
    <svg
      width="22"
      height="22"
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
  const isRight =
    config.position === "right_bottom" || config.position === "right_middle";
  const isMiddle =
    config.position === "right_middle" || config.position === "left_middle";
  // 컨테이너 max-w 480px 안쪽 16px에 위치하도록 viewport 기준 계산.
  // viewport >= 480 → 컨테이너 우측 가장자리 (= 50vw + 240) 안쪽 16px → right = 50vw - 224
  // viewport <  480 → 컨테이너 == viewport, 그냥 16px
  const sideOffset = "max(16px, calc(50vw - 224px))";

  const positionStyle: React.CSSProperties = isMiddle
    ? { top: "50%", transform: "translateY(-50%)" }
    : { bottom: "16px" };

  return (
    <div
      className="fixed z-50 flex flex-col gap-2"
      style={{
        ...positionStyle,
        [isRight ? "right" : "left"]: sideOffset,
      }}
    >
      {content.buttons.map((btn, i) => (
        <a
          key={i}
          href={buttonHref(btn.type, btn.value)}
          target={
            btn.type === "kakao" || btn.type === "external" ? "_blank" : undefined
          }
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
