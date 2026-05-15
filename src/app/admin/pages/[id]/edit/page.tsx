import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EssentialInfo } from "@/lib/types";
import { Editor } from "./Editor";
import { Step1Essential } from "@/app/me/pages/[id]/submit/Step1Essential";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();

  const [{ data: client }, { data: blocks }, { data: assets }, { data: blockTypes }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", page.client_id).maybeSingle(),
      supabase
        .from("blocks")
        .select("*")
        .eq("page_id", id)
        .order("sort_order", { ascending: true }),
      supabase.from("assets").select("*").eq("page_id", id),
      supabase
        .from("lookup_block_types")
        .select("key, name, category, is_system, default_config, default_content")
        .order("display_order"),
    ]);

  // 연결된 work_task (back link)
  const { data: task } = await supabase
    .from("work_tasks")
    .select("id")
    .eq("page_id", id)
    .maybeSingle();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/admin/tasks" className="hover:text-fg">
          작업 큐
        </Link>
        {task && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/admin/tasks/${task.id}`} className="hover:text-fg">
              {client?.business_name ?? page.slug}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span>편집기</span>
      </nav>

      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-fg leading-tight">
            {client?.business_name ?? "-"}
          </h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            <span className="font-mono">/{page.slug}</span>
            <span className="mx-2">·</span>
            {page.template_type}
            {page.tone_key && (
              <>
                <span className="mx-2">·</span>
                {page.tone_key}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {page.status === "published" && (
            <Link
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md border border-border-default text-[12px] text-fg hover:bg-bg-soft"
            >
              공개 페이지 →
            </Link>
          )}
          {task && (
            <Link
              href={`/admin/tasks/${task.id}`}
              className="px-3 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90"
            >
              작업 상세로
            </Link>
          )}
        </div>
      </div>

      <details className="mb-5 bg-bg rounded-lg border border-border-default">
        <summary className="cursor-pointer px-5 py-3 text-[13px] font-medium text-fg list-none flex items-center justify-between hover:bg-bg-soft rounded-lg">
          <span>페이지 기본 정보 (essential_info)</span>
          <span className="text-[11px] text-fg-tertiary">▾ 펼치기</span>
        </summary>
        <div className="px-5 py-4 border-t border-border-default">
          <p className="text-[11px] text-fg-tertiary mb-4">
            상호·전화·주소·영업시간·사업자번호 등 — 시스템·숨김 블록 6개에 자동
            반영됩니다.
          </p>
          <Step1Essential
            pageId={page.id}
            initialEssential={(page.essential_info ?? {}) as EssentialInfo}
            endpoint={`/api/v1/admin/pages/${page.id}/essential-info`}
          />
        </div>
      </details>

      <Editor
        pageId={page.id}
        pageSlug={page.slug}
        blocks={blocks ?? []}
        assets={assets ?? []}
        blockTypes={blockTypes ?? []}
        essentialInfo={(page.essential_info ?? {}) as Record<string, unknown>}
      />
    </div>
  );
}
