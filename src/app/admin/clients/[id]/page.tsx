import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PaymentForm } from "./PaymentForm";

interface Props {
  params: Promise<{ id: string }>;
}

const PAGE_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: {
    label: "준비 중",
    cls: "bg-bg-soft text-fg-secondary border border-border-default",
  },
  ai_generated: { label: "초안", cls: "bg-ai-soft text-ai-text-token" },
  in_review: { label: "검수 중", cls: "bg-ai-soft text-ai-text-token" },
  client_review: { label: "확인 요청", cls: "bg-info-soft text-info" },
  published: { label: "공개 중", cls: "bg-success-soft text-success" },
};

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, phone, kakao_id, email, business_name, business_type, signup_date, status, payment_status, invoice_number, invoiced_at, paid_at, payment_amount, notes",
    )
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, status, template_type, published_at, updated_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/admin/clients" className="hover:text-fg">
          클라이언트
        </Link>
        <span className="mx-2">/</span>
        <span>
          {client.business_name ?? "(이름 없음)"}
        </span>
      </nav>

      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          {client.business_name ?? "(이름 없음)"}
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          {client.business_type ?? "업종 미지정"} · 가입{" "}
          {formatDate(client.signup_date)} ·{" "}
          <span className="font-mono">{client.id}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <section className="bg-bg rounded-lg border border-border-default p-5">
          <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
            연락처
          </h2>
          <dl className="space-y-2 text-[12px]">
            <Item label="전화">{client.phone ?? "—"}</Item>
            <Item label="이메일">{client.email ?? "—"}</Item>
            <Item label="카카오 ID">{client.kakao_id ?? "—"}</Item>
            <Item label="계정 상태">{client.status}</Item>
          </dl>
        </section>

        <section className="bg-bg rounded-lg border border-border-default p-5">
          <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
            결제 정보
          </h2>
          <PaymentForm
            id={client.id}
            paymentStatus={client.payment_status}
            paymentAmount={client.payment_amount}
            invoiceNumber={client.invoice_number}
            invoicedAt={client.invoiced_at}
            paidAt={client.paid_at}
          />
        </section>
      </div>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
          페이지 ({pages?.length ?? 0})
        </h2>
        {!pages || pages.length === 0 ? (
          <div className="bg-bg rounded-lg border border-border-default p-6 text-center text-[12px] text-fg-tertiary">
            아직 페이지가 없습니다.
          </div>
        ) : (
          <ul className="space-y-2">
            {pages.map((p) => {
              const badge = PAGE_STATUS_BADGE[p.status];
              return (
                <li
                  key={p.id}
                  className="bg-bg rounded-lg border border-border-default p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/pages/${p.id}/edit`}
                        className="text-[13px] font-medium text-fg hover:underline"
                      >
                        /{p.slug}
                      </Link>
                      {badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-fg-tertiary">
                      {p.template_type}
                      {p.published_at && ` · 발행 ${formatDate(p.published_at)}`}
                    </p>
                  </div>
                  {p.status === "published" && (
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-info hover:underline shrink-0"
                    >
                      페이지 보기 ↗
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-[10px] text-fg-tertiary uppercase tracking-wider w-20 shrink-0">
        {label}
      </dt>
      <dd className="text-fg-secondary">{children}</dd>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
