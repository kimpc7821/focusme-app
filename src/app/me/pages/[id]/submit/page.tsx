import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import { SubmitWizard } from "./SubmitWizard";
import type { EssentialInfo } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * 사장님 자료 입력 폼 (v2 Step 0~3).
 * - 진입 가드: client 인증 + 본인 페이지 소유 + status 가 자료 입력 단계인지.
 * - 데이터 로딩: 페이지 row · blocks · template default + recommended_optional_blocks · lookup_block_types.
 * reference: docs/focusme-flow-simplification-guide-v2.md §3 + §11 A2
 */
export default async function SubmitPage({ params }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { id: pageId } = await params;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select(
      "id, slug, template_type, status, brand_color, tone_key, client_id, essential_info",
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

  // status별 라우팅 가드 — published 는 /edit 으로, client_review 는 /preview 로
  if (page.status === "published") {
    redirect(`/me/pages/${pageId}/edit`);
  }

  const { data: task } = await supabase
    .from("work_tasks")
    .select("status")
    .eq("page_id", pageId)
    .maybeSingle();

  if (task?.status === "client_review") {
    redirect(`/me/pages/${pageId}/preview`);
  }

  const [
    { data: blocks },
    { data: template },
    { data: blockTypes },
    { data: assets },
  ] = await Promise.all([
    supabase
      .from("blocks")
      .select("id, block_type, sort_order, is_enabled, is_system, config, content")
      .eq("page_id", pageId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("lookup_templates")
      .select("key, default_blocks, recommended_optional_blocks")
      .eq("key", page.template_type)
      .maybeSingle(),
    supabase
      .from("lookup_block_types")
      .select("key, name, default_config, default_content")
      .is("deprecated_at", null),
    supabase
      .from("assets")
      .select("id, block_id, category, url, meta")
      .eq("page_id", pageId)
      .order("uploaded_at", { ascending: false }),
  ]);

  const blockTypeMeta = (blockTypes ?? []).reduce<Record<string, { name: string; defaultConfig: unknown; defaultContent: unknown }>>(
    (acc, b) => {
      acc[b.key] = {
        name: b.name,
        defaultConfig: b.default_config,
        defaultContent: b.default_content,
      };
      return acc;
    },
    {},
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/me" className="hover:text-fg">
          내 페이지
        </Link>
        <span className="mx-2">/</span>
        <span>/{page.slug}</span>
        <span className="mx-2">/</span>
        <span>자료 입력</span>
      </nav>

      <SubmitWizard
        pageId={pageId}
        pageSlug={page.slug}
        templateType={page.template_type}
        essentialInfo={(page.essential_info ?? {}) as EssentialInfo}
        blocks={(blocks ?? []).map((b) => ({
          id: b.id,
          blockType: b.block_type,
          sortOrder: b.sort_order,
          isEnabled: b.is_enabled,
          isSystem: b.is_system,
          content: (b.content ?? {}) as Record<string, unknown>,
        }))}
        assets={(assets ?? []).map((a) => ({
          id: a.id,
          blockId: a.block_id,
          category: a.category,
          url: a.url,
        }))}
        recommendedOptionalBlocks={
          (template?.recommended_optional_blocks ?? []) as Array<{
            blockType: string;
            label: string;
            sortOrder: number;
          }>
        }
        blockTypeMeta={blockTypeMeta}
      />
    </div>
  );
}
