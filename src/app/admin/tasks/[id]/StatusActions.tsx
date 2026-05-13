"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateTaskStatusAction,
  publishPageAction,
} from "../../_actions/tasks";

const NEXT_STATUS: Record<string, { key: string; label: string }[]> = {
  new: [{ key: "ai_generated", label: "AI 생성 완료로 표시" }],
  ai_generated: [
    { key: "in_review", label: "검수 시작" },
    { key: "new", label: "신규로 되돌리기" },
  ],
  in_review: [
    { key: "client_review", label: "클라이언트 확인 보내기" },
    { key: "ai_generated", label: "검수 취소" },
  ],
  client_review: [
    { key: "done", label: "완료 처리" },
    { key: "in_review", label: "다시 검수로" },
  ],
  done: [{ key: "client_review", label: "재오픈" }],
};

interface Props {
  taskId: string;
  pageId: string;
  taskStatus: string;
  pageStatus: string;
  pageSlug: string;
}

export function StatusActions({
  taskId,
  pageId,
  taskStatus,
  pageStatus,
  pageSlug,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const change = (next: string) => {
    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, next);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  };

  const publish = () => {
    if (!confirm("이 페이지를 발행합니까? 발행 후 공개됩니다.")) return;
    startTransition(async () => {
      const result = await publishPageAction(taskId, pageId);
      if (result?.error) alert(result.error);
    });
  };

  const isPublished = pageStatus === "published";
  const options = NEXT_STATUS[taskStatus] ?? [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isPublished && options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled={pending}
          onClick={() => change(opt.key)}
          className="px-3 py-1.5 rounded-md border border-border-default text-[12px] text-fg hover:bg-bg-soft disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}
      <a
        href={`/admin/pages/${pageId}/edit`}
        className="px-3 py-1.5 rounded-md bg-ai-soft text-ai-text-token text-[12px] font-medium hover:opacity-90"
      >
        편집기 열기
      </a>
      {isPublished ? (
        <a
          href={`/p/${pageSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md bg-success-soft text-success text-[12px] font-medium hover:opacity-90"
        >
          공개 페이지 보기 →
        </a>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={publish}
          className="px-3 py-1.5 rounded-md bg-success text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          발행하기
        </button>
      )}
    </div>
  );
}
