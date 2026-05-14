import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import { ChangeRequestPanel } from "./ChangeRequestPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MyPageDetailPage({ params }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, status, brand_color, tone_key, published_at, updated_at, client_id")
    .eq("id", id)
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

  const { count: qrCount } = await supabase
    .from("qr_codes")
    .select("id", { count: "exact", head: true })
    .eq("page_id", id);

  const { count: blockCount } = await supabase
    .from("blocks")
    .select("id", { count: "exact", head: true })
    .eq("page_id", id);

  const { count: assetCount } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("page_id", id);

  const { data: changeRequests } = await supabase
    .from("change_requests")
    .select("*")
    .eq("page_id", id)
    .order("submitted_at", { ascending: false });

  const isPublished = page.status === "published";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/me" className="hover:text-fg">
          내 페이지
        </Link>
        <span className="mx-2">/</span>
        <span>/{page.slug}</span>
      </nav>

      <div className="bg-bg rounded-xl border border-border-default p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="w-3 h-3 rounded-full shrink-0 mt-1.5"
            style={{ background: page.brand_color ?? "#888" }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-medium text-fg leading-tight">
              /{page.slug}
            </h1>
            <p className="mt-1 text-[11px] text-fg-tertiary">
              {page.tone_key ?? "—"} · {isPublished ? "공개 중" : page.status}
              {page.published_at && ` · 발행 ${formatDate(page.published_at)}`}
            </p>
          </div>
          {isPublished && (
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md border border-border-default text-fg text-[12px] hover:bg-bg-soft shrink-0"
            >
              페이지 보기 ↗
            </a>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <Stat label="블록" value={blockCount ?? 0} />
          <Stat label="자료" value={assetCount ?? 0} />
          <Stat label="QR" value={qrCount ?? 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ActionCard
          href={`/me/pages/${id}/edit`}
          title="자료 수정"
          desc="텍스트·이미지를 바꾸면 페이지에 자동 반영됩니다. 큰 변경은 별도 문의로."
          accent="ai"
        />
        <ActionCard
          href={`/me/pages/${id}/qr`}
          title="QR 코드"
          desc="채널별 QR 발급·다운로드 — 명함·매장·광고·전단지 따로 추적 가능."
          accent="info"
        />
      </div>

      <div className="mt-8">
        <ChangeRequestPanel
          pageId={id}
          initialRequests={changeRequests ?? []}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-soft rounded-md py-2.5">
      <p className="text-[18px] font-medium text-fg leading-none">{value}</p>
      <p className="mt-1 text-fg-tertiary">{label}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  accent: "ai" | "info";
}) {
  const accentClass =
    accent === "ai"
      ? "border-ai-soft hover:border-ai-text-token"
      : "border-info-soft hover:border-info";
  return (
    <Link
      href={href}
      className={`block bg-bg rounded-lg border ${accentClass} p-5 transition-colors`}
    >
      <h3 className="text-[14px] font-medium text-fg">{title}</h3>
      <p className="mt-1 text-[11px] text-fg-tertiary leading-relaxed">
        {desc}
      </p>
    </Link>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
