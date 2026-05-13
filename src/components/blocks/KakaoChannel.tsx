import type { Block } from "@/lib/types";

interface Config {
  size: "medium" | "large";
  layout: "fullwidth" | "inline";
  channelType: "plus_friend" | "open_chat";
}
interface Content {
  url: string;
  label?: string;
  channelId?: string;
}

type Props = Block<Config, Content>;

function KakaoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 3C6.48 3 2 6.42 2 10.66c0 2.66 1.76 5 4.41 6.39l-1.04 3.79c-.08.3.23.54.5.4l4.55-3a11.6 11.6 0 0 0 1.58.11C17.52 18.35 22 14.93 22 10.66 22 6.42 17.52 3 12 3z" />
    </svg>
  );
}

export function KakaoChannel({ config, content }: Props) {
  const isLarge = config.size === "large";
  const isFull = config.layout === "fullwidth";
  const defaultLabel =
    config.channelType === "open_chat" ? "오픈채팅 입장" : "카톡 채널 친구 추가";

  return (
    <section className="px-5 py-3">
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${isFull ? "flex w-full" : "inline-flex"} items-center justify-center gap-2 rounded-md font-medium transition-opacity hover:opacity-90 active:opacity-80 text-[#191919] ${
          isLarge ? "py-3.5 px-5 text-[15px]" : "py-3 px-4 text-[14px]"
        }`}
        style={{ background: "#FEE500" }}
      >
        <KakaoIcon size={isLarge ? 22 : 20} />
        <span>{content.label || defaultLabel}</span>
      </a>
    </section>
  );
}
