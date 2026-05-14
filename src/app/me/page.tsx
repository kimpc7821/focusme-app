import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: {
    label: "준비 중",
    cls: "bg-bg-soft text-fg-secondary border border-border-default",
  },
  ai_generated: {
    label: "초안 검토 중",
    cls: "bg-ai-soft text-ai-text-token",
  },
  in_review: {
    label: "검수 중",
    cls: "bg-ai-soft text-ai-text-token",
  },
  client_review: {
    label: "확인 요청 도착",
    cls: "bg-info-soft text-info",
  },
  published: { label: "공개 중", cls: "bg-success-soft text-success" },
  archived: {
    label: "보관됨",
    cls: "bg-bg-soft text-fg-tertiary border border-border-default",
  },
};

export default async function MeDashboardPage() {
  const session = await getClientSession();
  if (!session) redirect("/login");

  const supabase = createServerSupabase();
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, payment_status")
    .eq("id", session.sub)
    .maybeSingle();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, status, published_at, updated_at")
    .eq("client_id", session.sub)
    .order("created_at", { ascending: false });

  const rows = pages ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          {client?.business_name
            ? `${client.business_name} 사장님,`
            : "사장님,"}
          <span className="text-fg-tertiary"> 안녕하세요</span>
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          내 페이지를 관리하고 자료를 수정할 수 있습니다.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
          내 페이지 ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <div className="bg-bg rounded-lg border border-border-default p-10 text-center">
            <p className="text-[13px] text-fg">아직 페이지가 없습니다.</p>
            <p className="mt-1 text-[11px] text-fg-tertiary">
              아래 "새 페이지 만들기" 로 문의해주세요.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((p) => {
              const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft;
              return (
                <li
                  key={p.id}
                  className="bg-bg rounded-lg border border-border-default p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/me/pages/${p.id}`}
                          className="text-[15px] font-medium text-fg hover:underline"
                        >
                          /{p.slug}
                        </Link>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-fg-tertiary">
                        {p.published_at
                          ? `발행 · ${formatDate(p.published_at)}`
                          : `마지막 수정 · ${formatDate(p.updated_at)}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 text-[12px]">
                      {p.status === "published" && (
                        <a
                          href={`/p/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-md border border-border-default text-fg hover:bg-bg-soft"
                        >
                          페이지 보기 ↗
                        </a>
                      )}
                      <Link
                        href={`/me/pages/${p.id}`}
                        className="px-3 py-1.5 rounded-md bg-info text-fg-inverse font-medium hover:opacity-90"
                      >
                        관리
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-bg rounded-lg border border-border-default p-5">
        <h2 className="text-[13px] font-medium text-fg">
          + 새 페이지 만들기
        </h2>
        <p className="mt-1 text-[11px] text-fg-tertiary leading-relaxed">
          22만원 · 평생 자료 영속 · 단순 변경 무료. 결제·계약은 카카오톡 문의로
          진행됩니다.
        </p>
        <a
          href="https://pf.kakao.com/_focusme"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 px-4 py-2 rounded-md bg-success text-fg-inverse text-[12px] font-medium hover:opacity-90"
        >
          카카오톡 문의
        </a>
      </section>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
