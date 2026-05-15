"use client";

import { useState } from "react";
import Link from "next/link";
import type { EssentialInfo } from "@/lib/types";
import { Step0BlockToggle } from "./Step0BlockToggle";
import { Step1Essential } from "./Step1Essential";
import { Step2Materials } from "./Step2Materials";
import { Step3Review } from "./Step3Review";

type StepKey = "blocks" | "essential" | "materials" | "review";

export interface BlockSummary {
  id: string;
  blockType: string;
  sortOrder: number;
  isEnabled: boolean;
  isSystem: boolean;
  content: Record<string, unknown>;
}

export interface AssetRef {
  id: string;
  blockId: string | null;
  category: string;
  url: string;
}

export interface RecommendedOptional {
  blockType: string;
  label: string;
  sortOrder: number;
}

interface Props {
  pageId: string;
  pageSlug: string;
  templateType: string;
  essentialInfo: EssentialInfo;
  blocks: BlockSummary[];
  assets: AssetRef[];
  recommendedOptionalBlocks: RecommendedOptional[];
  blockTypeMeta: Record<
    string,
    { name: string; defaultConfig: unknown; defaultContent: unknown }
  >;
}

const STEPS: { key: StepKey; label: string; description: string }[] = [
  { key: "blocks", label: "구성", description: "페이지에 들어갈 항목을 정해요" },
  { key: "essential", label: "필수 정보", description: "한 번만 적으면 곳곳에 자동 반영" },
  { key: "materials", label: "자료", description: "사진·텍스트 채우기" },
  { key: "review", label: "제출", description: "확인하고 보내기" },
];

export function SubmitWizard(props: Props) {
  const [step, setStep] = useState<StepKey>("blocks");
  const idx = STEPS.findIndex((s) => s.key === step);
  const current = STEPS[idx];

  return (
    <div>
      <h1 className="text-[20px] font-medium text-fg mb-1">자료 입력</h1>
      <p className="text-[12px] text-fg-tertiary mb-6">
        4단계로 나뉘어 있어요. 10~13분 정도 걸려요.
      </p>

      <StepIndicator currentIdx={idx} />

      <section className="mt-6 mb-3">
        <h2 className="text-[15px] font-medium text-fg">
          Step {idx}. {current.label}
        </h2>
        <p className="text-[12px] text-fg-tertiary">{current.description}</p>
      </section>

      <div className="bg-bg rounded-xl border border-border-default p-6">
        {step === "blocks" && (
          <Step0BlockToggle
            pageId={props.pageId}
            blocks={props.blocks}
            recommendedOptionalBlocks={props.recommendedOptionalBlocks}
            blockTypeMeta={props.blockTypeMeta}
          />
        )}
        {step === "essential" && (
          <Step1Essential
            pageId={props.pageId}
            initialEssential={props.essentialInfo}
          />
        )}
        {step === "materials" && (
          <Step2Materials
            pageId={props.pageId}
            blocks={props.blocks}
            assets={props.assets}
            blockTypeMeta={props.blockTypeMeta}
          />
        )}
        {step === "review" && (
          <Step3Review
            pageId={props.pageId}
            essentialInfo={props.essentialInfo}
            blocks={props.blocks}
            assets={props.assets}
            blockTypeMeta={props.blockTypeMeta}
          />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        {idx > 0 ? (
          <button
            type="button"
            onClick={() => setStep(STEPS[idx - 1].key)}
            className="px-4 py-2 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft"
          >
            이전
          </button>
        ) : (
          <Link
            href="/me"
            className="px-4 py-2 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft"
          >
            나가기
          </Link>
        )}
        {idx < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(STEPS[idx + 1].key)}
            className="px-4 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90"
          >
            다음
          </button>
        ) : (
          <span className="text-[11px] text-fg-tertiary">
            제출 버튼은 위 폼 안에서 누르세요
          </span>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ currentIdx }: { currentIdx: number }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {STEPS.map((s, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const dotCls = isCurrent
          ? "bg-info"
          : isDone
            ? "bg-success"
            : "bg-bg-soft border border-border-default";
        const textCls = isCurrent
          ? "text-fg font-medium"
          : isDone
            ? "text-fg-secondary"
            : "text-fg-tertiary";
        return (
          <div key={s.key} className="flex-1 flex flex-col items-center">
            <div className="w-full flex items-center">
              <div className={`flex-1 h-0.5 ${i === 0 ? "" : isDone || isCurrent ? "bg-success" : "bg-border-default"}`} />
              <span className={`w-3 h-3 rounded-full ${dotCls} shrink-0`} />
              <div className={`flex-1 h-0.5 ${i === STEPS.length - 1 ? "" : isDone ? "bg-success" : "bg-border-default"}`} />
            </div>
            <p className={`mt-1 text-[10px] ${textCls}`}>{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}

