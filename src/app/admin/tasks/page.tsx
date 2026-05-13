import Link from "next/link";
import {
  listTasksForAdmin,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABELS,
} from "@/lib/db/tasks";

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const STATUS_TABS = [
  { key: "all", label: "전체" },
  { key: "new", label: "신규" },
  { key: "ai_generated", label: "AI 생성" },
  { key: "in_review", label: "검수 중" },
  { key: "client_review", label: "클라이언트 확인" },
  { key: "done", label: "완료" },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${mi}`;
}

export default async function TasksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeTab = sp.status ?? "all";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;

  const statusFilter = activeTab === "all" ? undefined : [activeTab];
  const { rows, total } = await listTasksForAdmin({
    status: statusFilter,
    page,
    limit,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-medium text-fg leading-tight">
            작업 큐
          </h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            클라이언트 페이지 제작 · 검수 · 발행 작업 관리
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="px-4 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90"
        >
          + 새 페이지 만들기
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-4 border-b border-border-default">
        {STATUS_TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/tasks" : `/admin/tasks?status=${t.key}`}
              className={`px-4 py-2.5 text-[12px] -mb-[1px] border-b-2 ${
                isActive
                  ? "border-info text-info font-medium"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* 리스트 */}
      {rows.length === 0 ? (
        <div className="bg-bg rounded-lg border border-border-default p-12 text-center text-[13px] text-fg-tertiary">
          작업이 없습니다.
        </div>
      ) : (
        <div className="bg-bg rounded-lg border border-border-default overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-soft text-[11px] text-fg-tertiary uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-left font-medium">업체명</th>
                <th className="px-4 py-3 text-left font-medium">슬러그</th>
                <th className="px-4 py-3 text-left font-medium">업종</th>
                <th className="px-4 py-3 text-left font-medium">생성일</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-border-default">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-bg-soft transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-medium ${
                        TASK_STATUS_BADGE[row.status] ?? ""
                      }`}
                    >
                      {TASK_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-fg">
                    {row.business_name}
                  </td>
                  <td className="px-4 py-3 text-fg-secondary font-mono">
                    /{row.page_slug}
                  </td>
                  <td className="px-4 py-3 text-fg-secondary">
                    {row.business_type}
                  </td>
                  <td className="px-4 py-3 text-fg-tertiary text-[12px]">
                    {fmtDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/tasks/${row.id}`}
                      className="text-info text-[12px] font-medium hover:underline"
                    >
                      열기 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[12px] text-fg-secondary">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              const params = new URLSearchParams();
              if (activeTab !== "all") params.set("status", activeTab);
              if (n > 1) params.set("page", String(n));
              const qs = params.toString();
              const href = qs ? `/admin/tasks?${qs}` : "/admin/tasks";
              return (
                <Link
                  key={n}
                  href={href}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    n === page
                      ? "bg-info text-fg-inverse font-medium"
                      : "text-fg-secondary hover:bg-bg-soft"
                  }`}
                >
                  {n}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
