import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { resolveBlocksWithEssential } from "@/lib/services/resolve-essential";
import type { Block, BlockType, EssentialInfo } from "@/lib/types";
import { ApprovalBar } from "./ApprovalBar";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * 사장님 미리보기 (v2 A4) — client_review 단계만 진입.
 *
 * 진입 가드:
 *   - 인증 + 본인 페이지 소유
 *   - work_tasks.status === 'client_review' 일 때만 정상 렌더
 *   - draft + work_tasks.new/in_review → /submit redirect
 *   - published → /edit redirect
 *
 * 렌더: essential_info 단방향 주입된 블록을 /p/[slug] 와 동일하게 렌더 + 하단 sticky 액션 바.
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §2 [5] + §11 A4
 */
export default async function PreviewPage({ params }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { id: pageId } = await params;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select(
      "id, slug, status, brand_color, tone_key, client_id, essential_info, template_type",
    )
    .eq("id", pageId)
    .maybeSingle();
  if (!page) notFound();
  if (page.client_id !== session.sub) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-[14px] text-danger">본인 페이지가 아닙니다.</p>
        <Link
          href="/me"
          className="mt-3 inline-block text-[12px] text-info hover:underline"
        >
          내 페이지로 돌아가기
        </Link>
      </div>
    );
  }

  if (page.status === "published") {
    redirect(`/me/pages/${pageId}/edit`);
  }

  const { data: task } = await supabase
    .from("work_tasks")
    .select("id, status")
    .eq("page_id", pageId)
    .maybeSingle();

  if (!task || task.status === "new") {
    redirect(`/me/pages/${pageId}/submit`);
  }
  if (task.status === "in_review") {
    // 직원이 아직 검수 중 — 사장님은 자료 입력 단계로
    redirect(`/me/pages/${pageId}/submit`);
  }
  if (task.status === "done") {
    redirect(`/me/pages/${pageId}/edit`);
  }
  // task.status === 'client_review' 또는 'ai_generated' → 정상 진입

  const alreadyApproved = !!(task as { client_approved_at?: string | null })
    .client_approved_at;

  const { data: blocksRaw } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  const essentialInfo = (page.essential_info ?? {}) as EssentialInfo;
  const blocks: Block[] = (blocksRaw ?? []).map((b) => ({
    id: b.id,
    pageId: b.page_id,
    blockType: b.block_type as BlockType,
    sortOrder: b.sort_order,
    isEnabled: b.is_enabled,
    isSystem: b.is_system,
    config: b.config,
    content: b.content,
  }));
  const resolved = resolveBlocksWithEssential(blocks, essentialInfo);

  return (
    <div data-tone={page.tone_key ?? "warm_minimal"} className="bg-bg-soft pb-32">
      <nav className="max-w-2xl mx-auto px-6 pt-6 mb-3 text-[12px] text-fg-tertiary">
        <Link href="/me" className="hover:text-fg">
          내 페이지
        </Link>
        <span className="mx-2">/</span>
        <span>/{page.slug}</span>
        <span className="mx-2">/</span>
        <span>미리보기</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 mb-4">
        <p className="text-[12px] text-fg-secondary leading-relaxed">
          작업한 페이지를 미리보세요. 이대로 괜찮으면 "이대로 발행", 수정할 게
          있으면 "수정 요청" 을 눌러주세요.
        </p>
      </div>

      {/* /p/[slug] 와 동일한 framing — 모바일 360 / 데스크탑 carded */}
      <div className="mx-auto w-full max-w-[480px] bg-bg relative md:my-6 md:rounded-[24px] md:overflow-hidden md:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        {resolved.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>

      <ApprovalBar pageId={pageId} alreadyApproved={alreadyApproved} />
    </div>
  );
}
