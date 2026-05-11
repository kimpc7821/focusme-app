import { notFound } from "next/navigation";
import { mockPagesBySlug } from "@/lib/mock/noeul";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = mockPagesBySlug[slug];
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
  const data = mockPagesBySlug[slug];
  if (!data) notFound();

  const sortedBlocks = [...data.blocks].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div data-tone={data.page.toneKey} className="min-h-full w-full bg-bg-soft">
      {/* 데스크탑에서 모바일 mockup처럼 가운데 정렬 */}
      <div className="mx-auto w-full max-w-[480px] bg-bg shadow-sm relative min-h-screen">
        {sortedBlocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
