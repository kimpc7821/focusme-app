import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/db/pages";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
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
  const headerBlock = data.blocks.find((b) => b.blockType === "profile_header");
  const headerContent = headerBlock?.content as
    | { title?: string; tagline?: string }
    | undefined;
  return {
    title: `${headerContent?.title ?? data.page.businessName} | FocusMe`,
    description: headerContent?.tagline,
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPageBySlug(slug);
  if (!data) notFound();

  const sortedBlocks = [...data.blocks].sort(
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
      </div>
    </div>
  );
}
