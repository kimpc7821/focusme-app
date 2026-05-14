import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

const RANGE_TABS: { key: string; label: string; days?: number }[] = [
  { key: "30", label: "최근 30일", days: 30 },
  { key: "90", label: "최근 90일", days: 90 },
  { key: "365", label: "최근 1년", days: 365 },
  { key: "all", label: "전체" },
];

interface Props {
  searchParams: Promise<{ range?: string; q?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const range = params.range ?? "90";
  const q = params.q?.trim() ?? "";

  const days = RANGE_TABS.find((t) => t.key === range)?.days;
  const since = days
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const supabase = createServerSupabase();
  let query = supabase
    .from("reports")
    .select("id, client_id, page_id, period_start, period_end, ai_insight, pdf_url, status, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (since) query = query.gte("created_at", since);

  const { data: reports } = await query;
  const rows = reports ?? [];

  // 클라이언트 이름 일괄 조회 (N+1 회피).
  const clientIds = Array.from(new Set(rows.map((r) => r.client_id)));
  const pageIds = Array.from(
    new Set(rows.map((r) => r.page_id).filter((v): v is string => Boolean(v))),
  );
  const clientMap = new Map<string, string>();
  const pageMap = new Map<string, string>();

  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, business_name")
      .in("id", clientIds);
    for (const c of clients ?? [])
      clientMap.set(c.id, c.business_name ?? "(이름 없음)");
  }
  if (pageIds.length > 0) {
    const { data: pages } = await supabase
      .from("pages")
      .select("id, slug")
      .in("id", pageIds);
    for (const p of pages ?? []) pageMap.set(p.id, p.slug);
  }

  const filtered = q
    ? rows.filter((r) => {
        const name = clientMap.get(r.client_id) ?? "";
        const slug = r.page_id ? pageMap.get(r.page_id) ?? "" : "";
        return (
          name.toLowerCase().includes(q.toLowerCase()) ||
          slug.toLowerCase().includes(q.toLowerCase())
        );
      })
    : rows;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          분석 리포트
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          생성된 리포트 전체 목록. 클라이언트별 PDF 다운로드 가능. 발송 채널은
          외부 도구로.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <nav className="flex flex-wrap gap-1 text-[12px]">
          {RANGE_TABS.map((t) => {
            const active = range === t.key;
            const qPart = q ? `&q=${encodeURIComponent(q)}` : "";
            return (
              <Link
                key={t.key}
                href={`/admin/reports?range=${t.key}${qPart}`}
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
          action="/admin/reports"
          method="GET"
          className="flex items-center gap-2"
        >
          <input type="hidden" name="range" value={range} />
          <input
            name="q"
            defaultValue={q}
            placeholder="상호명·페이지 slug 검색"
            className="px-3 py-1.5 text-[12px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-bg rounded-lg border border-border-default p-10 text-center text-[13px] text-fg-tertiary">
          해당 조건의 리포트가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const clientName = clientMap.get(r.client_id) ?? "(이름 없음)";
            const slug = r.page_id ? pageMap.get(r.page_id) : null;
            return (
              <li
                key={r.id}
                className="bg-bg rounded-lg border border-border-default p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="text-[14px] font-medium text-fg hover:underline"
                      >
                        {clientName}
                      </Link>
                      {slug && (
                        <span className="text-[11px] text-fg-tertiary">
                          · /{slug}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-fg-tertiary">
                      기간 {formatDate(r.period_start)} ~{" "}
                      {formatDate(r.period_end)} · 생성{" "}
                      {formatDate(r.created_at)}
                    </p>
                    {r.ai_insight && (
                      <p className="mt-2 text-[12px] text-fg-secondary line-clamp-2">
                        💡 {r.ai_insight}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-[12px] shrink-0">
                    <Link
                      href={`/admin/reports/${r.id}`}
                      className="px-3 py-1.5 rounded-md border border-border-default text-fg hover:bg-bg-soft text-center"
                    >
                      상세
                    </Link>
                    <a
                      href={`/api/v1/admin/reports/${r.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-info text-fg-inverse font-medium hover:opacity-90 text-center"
                    >
                      PDF ↓
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
