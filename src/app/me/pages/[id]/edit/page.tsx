import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import { EditForm, type EditableBlock } from "./EditForm";

interface Props {
  params: Promise<{ id: string }>;
}

const BLOCK_LABEL: Record<string, string> = {
  profile_header: "프로필 헤더",
  hero_carousel: "메인 이미지",
  brand_story: "브랜드 스토리",
  product_cards: "상품 카드",
  gallery_grid: "갤러리",
  reviews: "후기",
  faq: "자주 묻는 질문",
  instagram_embed: "인스타그램",
  phone_button: "전화 버튼",
  kakao_channel: "카카오 채널",
  sns_buttons: "SNS 버튼",
  contact_form: "문의 폼",
  map: "지도",
  location_info: "오시는 길",
  legal_footer: "법적 푸터",
  floating_cta: "Floating CTA",
};

export default async function EditPage({ params }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();
  if (page.client_id !== session.sub) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center text-[13px] text-danger">
        본인 페이지가 아닙니다.
      </div>
    );
  }

  const { data: rawBlocks } = await supabase
    .from("blocks")
    .select("id, block_type, sort_order, is_enabled, content")
    .eq("page_id", id)
    .order("sort_order", { ascending: true });

  const blocks: EditableBlock[] = (rawBlocks ?? [])
    .filter((b) => b.is_enabled)
    .map((b) => ({
      id: b.id,
      blockType: b.block_type,
      label: BLOCK_LABEL[b.block_type] ?? b.block_type,
      content: (b.content as Record<string, unknown>) ?? {},
    }));

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/me" className="hover:text-fg">
          내 페이지
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/me/pages/${id}`} className="hover:text-fg">
          /{page.slug}
        </Link>
        <span className="mx-2">/</span>
        <span>자료 수정</span>
      </nav>

      <div className="mb-5">
        <h1 className="text-[20px] font-medium text-fg leading-tight">
          자료 수정
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          텍스트 변경은 저장 즉시 페이지에 반영됩니다. 블록 추가·제거·디자인
          변경은 카카오톡 문의로 별도 진행됩니다.
        </p>
      </div>

      <EditForm pageId={id} blocks={blocks} />
    </div>
  );
}
