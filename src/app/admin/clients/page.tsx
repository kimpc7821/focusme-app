import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "결제 대기",
    cls: "bg-bg-soft text-fg-secondary border border-border-default",
  },
  invoiced: { label: "계산서 발행", cls: "bg-ai-soft text-ai-text-token" },
  paid: { label: "결제 완료", cls: "bg-success-soft text-success" },
  refunded: { label: "환불", cls: "bg-danger-soft text-danger" },
  cancelled: { label: "취소", cls: "bg-danger-soft text-danger" },
};

const PAYMENT_TABS: { key: string; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "결제 대기" },
  { key: "invoiced", label: "계산서 발행" },
  { key: "paid", label: "결제 완료" },
];

interface Props {
  searchParams: Promise<{ paymentStatus?: string; q?: string }>;
}

export default async function AdminClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedTab = params.paymentStatus ?? "all";
  const q = params.q?.trim() ?? "";

  const supabase = createServerSupabase();
  let query = supabase
    .from("clients")
    .select(
      "id, phone, kakao_id, email, business_name, business_type, signup_date, status, payment_status, paid_at, payment_amount",
    )
    .order("signup_date", { ascending: false })
    .limit(100);

  if (selectedTab !== "all") query = query.eq("payment_status", selectedTab);
  if (q) {
    query = query.or(
      `business_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  const { data: clients } = await query;
  const rows = clients ?? [];

  // 각 클라이언트의 페이지 수 (한방 쿼리).
  const clientIds = rows.map((r) => r.id);
  const pageCountMap = new Map<string, number>();
  if (clientIds.length > 0) {
    const { data: pages } = await supabase
      .from("pages")
      .select("client_id")
      .in("client_id", clientIds);
    for (const p of pages ?? []) {
      pageCountMap.set(p.client_id, (pageCountMap.get(p.client_id) ?? 0) + 1);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          클라이언트
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          가입한 사장님 목록. 결제 상태 매뉴얼 관리.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <nav className="flex flex-wrap gap-1 text-[12px]">
          {PAYMENT_TABS.map((t) => {
            const active = selectedTab === t.key;
            const qPart = q ? `&q=${encodeURIComponent(q)}` : "";
            return (
              <Link
                key={t.key}
                href={`/admin/clients?paymentStatus=${t.key}${qPart}`}
                className={`px-3 py-1.5 rounded-md border transition-colors ${
                  active
                    ? "border-fg text-fg font-medium bg-bg"
                    : "border-border-default text-fg-secondary hover:bg-bg-soft"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <form
          action="/admin/clients"
          method="GET"
          className="flex items-center gap-2"
        >
          {selectedTab !== "all" && (
            <input type="hidden" name="paymentStatus" value={selectedTab} />
          )}
          <input
            name="q"
            defaultValue={q}
            placeholder="상호명·전화·이메일 검색"
            className="px-3 py-1.5 text-[12px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="bg-bg rounded-lg border border-border-default p-10 text-center text-[13px] text-fg-tertiary">
          해당 조건의 클라이언트가 없습니다.
        </div>
      ) : (
        <div className="bg-bg rounded-lg border border-border-default overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-bg-soft text-fg-tertiary text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">상호명</th>
                <th className="px-4 py-2 text-left">업종</th>
                <th className="px-4 py-2 text-left">연락처</th>
                <th className="px-4 py-2 text-left">가입일</th>
                <th className="px-4 py-2 text-left">페이지</th>
                <th className="px-4 py-2 text-left">결제</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {rows.map((c) => {
                const badge =
                  PAYMENT_BADGE[c.payment_status] ?? PAYMENT_BADGE.pending;
                return (
                  <tr key={c.id} className="hover:bg-bg-soft">
                    <td className="px-4 py-3 font-medium text-fg">
                      {c.business_name ?? (
                        <span className="text-fg-tertiary italic">(이름 없음)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-secondary">
                      {c.business_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-secondary font-mono">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-tertiary">
                      {formatDate(c.signup_date)}
                    </td>
                    <td className="px-4 py-3 text-fg">
                      {pageCountMap.get(c.id) ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      {c.payment_amount != null && (
                        <span className="ml-2 text-[11px] text-fg-tertiary">
                          {c.payment_amount.toLocaleString()}원
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="text-info hover:underline"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
