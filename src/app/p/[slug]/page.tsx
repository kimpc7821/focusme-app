import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/db/pages";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { Tracker } from "@/components/Tracker";
import { resolveBlocksWithEssential } from "@/lib/services/resolve-essential";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageBySlug(slug);
  if (!data) return { title: "페이지를 찾을 수 없습니다 | FocusMe" };
  const essential = data.page.essentialInfo ?? {};
  const title = essential.businessName ?? data.page.businessName;
  const description = essential.tagline;
  return {
    title: `${title} | FocusMe`,
    description,
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPageBySlug(slug);
  if (!data) notFound();

  // v2: essential_info 단방향 주입 — 시스템·숨김 블록(6종)에 자동 반영.
  const resolvedBlocks = resolveBlocksWithEssential(
    data.blocks,
    data.page.essentialInfo ?? {},
  );

  const sortedBlocks = [...resolvedBlocks].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div
      data-tone={data.page.toneKey}
      className="min-h-full w-full bg-bg-soft"
    >
      {/* 모바일: 풀폭 / 데스크탑: 가운데 정렬 + 외곽 라운드 카드 */}
      <div className="mx-auto w-full max-w-[480px] bg-bg relative min-h-screen md:min-h-0 md:my-6 md:rounded-[24px] md:overflow-hidden md:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        {sortedBlocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
        <Tracker pageId={data.page.id} />
      </div>
    </div>
  );
}
