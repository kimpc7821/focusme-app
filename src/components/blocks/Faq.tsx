"use client";

import { useState } from "react";
import type { Block } from "@/lib/types";
import { SectionTitle } from "./SectionTitle";

interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

interface Config {
  layout: "accordion" | "expanded";
  showSearchBox: boolean;
  numbering: boolean;
}
interface Content {
  title?: string;
  items: FaqItem[];
}

type Props = Block<Config, Content>;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function Faq({ config, content }: Props) {
  const items = content.items ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(
    config.layout === "expanded" ? -1 : null,
  );
  const [query, setQuery] = useState("");

  if (items.length === 0) return null;

  const filtered =
    query.trim() === ""
      ? items
      : items.filter(
          (it) =>
            it.question.toLowerCase().includes(query.toLowerCase()) ||
            it.answer.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <section className="px-5 py-7">
      {content.title && <SectionTitle title={content.title} className="mb-4" />}

      {config.showSearchBox && items.length >= 5 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="질문 검색…"
          className="w-full mb-3 px-3 py-2 text-[13px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
        />
      )}

      <div className="space-y-2">
        {filtered.map((it, i) => {
          const isOpen =
            config.layout === "expanded" ? true : openIdx === i;
          return (
            <div
              key={i}
              className="rounded-md border border-border-default bg-bg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  if (config.layout === "accordion") {
                    setOpenIdx(isOpen ? null : i);
                  }
                }}
                disabled={config.layout === "expanded"}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-medium text-fg hover:bg-bg-soft transition-colors disabled:cursor-default"
              >
                <span className="flex items-baseline gap-2">
                  {config.numbering && (
                    <span className="text-fg-tertiary text-[11px] font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span>{it.question}</span>
                </span>
                {config.layout === "accordion" && <ChevronIcon open={isOpen} />}
              </button>
              {isOpen && (
                <div className="px-4 pb-3 pt-1 text-[12px] leading-relaxed text-fg-secondary whitespace-pre-wrap">
                  {it.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-3 text-center text-[12px] text-fg-tertiary">
          일치하는 질문이 없습니다.
        </p>
      )}
    </section>
  );
}
