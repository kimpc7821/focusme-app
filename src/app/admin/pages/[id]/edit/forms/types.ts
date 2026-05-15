import type { EssentialInfo } from "@/lib/types";

export interface AssetRef {
  id: string;
  url: string;
  category: string;
}

export interface BlockFormProps {
  config: Record<string, unknown>;
  content: Record<string, unknown>;
  onConfig: (next: Record<string, unknown>) => void;
  onContent: (next: Record<string, unknown>) => void;
  assets: AssetRef[];
  /**
   * v2: 페이지의 essential_info — 시스템·숨김 블록의 read-only 필드 값 표시용.
   * 단방향 source of truth (resolve-essential.ts 와 일치).
   */
  essentialInfo?: EssentialInfo;
}
