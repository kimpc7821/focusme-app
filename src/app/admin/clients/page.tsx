import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const supabase = createServerSupabase();
  let query = supabase
    .from("clients")
    .select(
      "id, phone, kakao_id, email, business_name, business_type, signup_date, status",
    )
    .order("signup_date", { ascending: false })
    .limit(100);

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
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-medium text-fg leading-tight">
            클라이언트
          </h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            가입한 사장님 목록.
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="px-4 py-2 rounded-md bg-info text-fg-inverse text-[13px] font-medium hover:opacity-90 shrink-0"
        >
          + 클라이언트 등록
        </Link>
      </div>

      <div className="flex justify-end mb-5">
        <form
          action="/admin/clients"
          method="GET"
          className="flex items-center gap-2"
        >
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
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-bg-soft">
                  <td className="px-4 py-3 font-medium text-fg">
                    {c.business_name ?? (
                      <span className="text-fg-tertiary italic">
                        (이름 없음)
                      </span>
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="text-info hover:underline"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
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
