import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { ChangeRequestRow } from "./ChangeRequestRow";

const VALID_STATUS = ["pending", "quoted", "in_progress", "completed", "rejected"] as const;
type Status = (typeof VALID_STATUS)[number];

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "pending", label: "신규 접수" },
  { key: "quoted", label: "견적 회신" },
  { key: "in_progress", label: "진행 중" },
  { key: "completed", label: "완료" },
  { key: "rejected", label: "반려" },
  { key: "all", label: "전체" },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminChangeRequestsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selected =
    (params.status && VALID_STATUS.includes(params.status as Status))
      ? (params.status as Status)
      : ("pending" as Status);

  const supabase = createServerSupabase();
  let q = supabase
    .from("change_requests")
    .select("*, pages(slug, client_id)")
    .order("submitted_at", { ascending: false });
  if (params.status !== "all") q = q.eq("status", selected);

  const { data: rows } = await q;
  const requests = (rows ?? []) as Array<{
    id: string;
    page_id: string;
    request_type: string;
    description: string;
    status: string;
    quoted_cost: number | null;
    notes: string | null;
    submitted_at: string;
    quoted_at: string | null;
    completed_at: string | null;
    pages: { slug: string | null; client_id: string | null } | null;
  }>;

  // 클라이언트 business_name 묶어서 조회 (N+1 회피).
  const clientIds = Array.from(
    new Set(
      requests
        .map((r) => r.pages?.client_id)
        .filter((v): v is string => Boolean(v)),
    ),
  );
  const clientMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, business_name")
      .in("id", clientIds);
    for (const c of clients ?? []) {
      clientMap.set(c.id, c.business_name ?? "(이름 없음)");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          변경 요청 큐
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          사장님이 보낸 큰 변경 의뢰. 견적 회신·진행·완료 처리.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 mb-5 text-[12px]">
        {STATUS_TABS.map((t) => {
          const active = (params.status ?? "pending") === t.key;
          return (
            <Link
              key={t.key}
              href={`/admin/change-requests?status=${t.key}`}
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

      {requests.length === 0 ? (
        <div className="bg-bg rounded-lg border border-border-default p-10 text-center text-[13px] text-fg-tertiary">
          해당 상태의 변경 요청이 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <ChangeRequestRow
              key={r.id}
              request={r}
              pageSlug={r.pages?.slug ?? null}
              clientName={
                r.pages?.client_id
                  ? clientMap.get(r.pages.client_id) ?? null
                  : null
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
