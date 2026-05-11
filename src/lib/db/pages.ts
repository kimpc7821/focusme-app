import type { Block, BlockType, PageWithBlocks, ToneKey } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockPagesBySlug } from "@/lib/mock/noeul";

/**
 * 환경변수 있으면 Supabase 우선, DB 결과 없으면 mock fallback.
 * env 없으면 곧장 mock.
 * → 마이그레이션·시드 끝나기 전에도 페이지가 깨지지 않게.
 */
export async function getPageBySlug(
  slug: string,
): Promise<PageWithBlocks | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return mockPagesBySlug[slug] ?? null;
  }

  const fromDb = await fetchFromSupabase(slug);
  if (fromDb) return fromDb;
  return mockPagesBySlug[slug] ?? null;
}

async function fetchFromSupabase(
  slug: string,
): Promise<PageWithBlocks | null> {
  const supabase = createServerSupabase();
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (pageError || !page) return null;

  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", page.id)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  if (blocksError) return null;

  return {
    page: {
      id: page.id,
      slug: page.slug,
      templateType: page.template_type as PageWithBlocks["page"]["templateType"],
      brandColor: page.brand_color,
      toneKey: (page.tone_key ?? "warm_minimal") as ToneKey,
      businessName: (page as { business_name?: string }).business_name ?? "",
      publishedAt: page.published_at ?? page.created_at,
    },
    blocks: (blocks ?? []).map(
      (b): Block => ({
        id: b.id,
        pageId: b.page_id,
        blockType: b.block_type as BlockType,
        sortOrder: b.sort_order,
        isEnabled: b.is_enabled,
        isSystem: b.is_system,
        config: b.config,
        content: b.content,
      }),
    ),
  };
}
