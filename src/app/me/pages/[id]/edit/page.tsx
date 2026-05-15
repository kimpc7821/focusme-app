import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import type { EssentialInfo } from "@/lib/types";
import { EditForm, type EditableBlock } from "./EditForm";
import { Step1Essential } from "../submit/Step1Essential";
import { ChangeRequestPanel } from "../ChangeRequestPanel";

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
    .select("id, slug, status, client_id, essential_info")
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

  // 자료 수정은 발행 후에만 의미 있음. 발행 전이면 status 별 분기로.
  if (page.status !== "published") {
    redirect(`/me/pages/${id}`);
  }

  const [{ data: rawBlocks }, { data: changeRequests }] = await Promise.all([
    supabase
      .from("blocks")
      .select("id, block_type, sort_order, is_enabled, content")
      .eq("page_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("change_requests")
      .select("*")
      .eq("page_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

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
        <span>/{page.slug}</span>
        <span className="mx-2">/</span>
        <span>관리</span>
      </nav>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-medium text-fg leading-tight">
            관리
          </h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            텍스트 변경은 저장 즉시 페이지에 반영됩니다. 블록 추가·제거·디자인
            변경은 아래 "큰 변경 의뢰" 로 보내주세요.
          </p>
        </div>
        <a
          href={`/p/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft shrink-0"
        >
          페이지 보기
        </a>
      </div>

      <section className="mb-10">
        <h2 className="text-[13px] font-medium text-fg mb-3">
          페이지 기본 정보
        </h2>
        <p className="text-[11px] text-fg-tertiary mb-4">
          여기 적은 정보는 페이지 곳곳 (프로필·오시는 길·푸터·Floating 버튼 등)에
          자동으로 반영됩니다.
        </p>
        <Step1Essential
          pageId={id}
          initialEssential={(page.essential_info ?? {}) as EssentialInfo}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-[13px] font-medium text-fg mb-3">블록별 자료</h2>
        <EditForm pageId={id} blocks={blocks} />
      </section>

      <div className="mt-10">
        <ChangeRequestPanel
          pageId={id}
          initialRequests={changeRequests ?? []}
        />
      </div>
    </div>
  );
}
