import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPageAnalytics } from "@/lib/db/analytics";
import { createReportAction } from "@/app/admin/_actions/reports";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

function fmtDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

function parseDate(v: string | undefined, fallback: Date): Date {
  if (!v) return fallback;
  const d = new Date(v);
  return isNaN(d.getTime()) ? fallback : d;
}

const TARGET_LABEL: Record<string, string> = {
  kakao: "카톡 채널",
  phone: "전화",
  external_link: "외부 링크",
  form_submit: "폼 제출",
};

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, template_type, tone_key, client_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("business_name")
    .eq("id", page.client_id)
    .maybeSingle();

  const { data: task } = await supabase
    .from("work_tasks")
    .select("id")
    .eq("page_id", id)
    .maybeSingle();

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = parseDate(sp.to, now);
  const from = parseDate(sp.from, defaultFrom);

  const analytics = await getPageAnalytics({ pageId: id, from, to });

  const peakHour = analytics.byHour.indexOf(Math.max(...analytics.byHour, 1));
  const maxHourVal = Math.max(...analytics.byHour, 1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/admin/tasks" className="hover:text-fg">
          작업 큐
        </Link>
        {task && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/admin/tasks/${task.id}`} className="hover:text-fg">
              {client?.business_name ?? page.slug}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span>분석</span>
      </nav>

      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h1 className="text-[22px] font-medium text-fg leading-tight">
            {client?.business_name ?? "-"} 분석
          </h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            /{page.slug} · {fmtDay(from)} ~ {fmtDay(to)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            method="get"
            className="flex items-center gap-2 text-[12px] text-fg-secondary"
          >
            <label className="flex items-center gap-1">
              from
              <input
                type="date"
                name="from"
                defaultValue={fmtDay(from)}
                className="px-2 py-1 rounded border border-border-default bg-bg text-fg"
              />
            </label>
            <label className="flex items-center gap-1">
              to
              <input
                type="date"
                name="to"
                defaultValue={fmtDay(to)}
                className="px-2 py-1 rounded border border-border-default bg-bg text-fg"
              />
            </label>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-info text-fg-inverse hover:opacity-90"
            >
              조회
            </button>
          </form>
          <form action={createReportAction}>
            <input type="hidden" name="pageId" value={id} />
            <input type="hidden" name="periodStart" value={fmtDay(from)} />
            <input type="hidden" name="periodEnd" value={fmtDay(to)} />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md text-[12px] font-medium hover:opacity-90"
              style={{
                background: "var(--color-ai-strong)",
                color: "white",
              }}
            >
              ✦ 이 기간으로 리포트 생성
            </button>
          </form>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi
          label="총 방문"
          value={analytics.summary.totalViews}
          delta={analytics.summary.comparison?.changePercent}
        />
        <Kpi
          label="유니크 세션"
          value={analytics.summary.uniqueSessions}
        />
        <Kpi label="카톡 클릭" value={analytics.summary.kakaoClicks} />
        <Kpi label="전화 클릭" value={analytics.summary.phoneClicks} />
        <Kpi label="외부 링크" value={analytics.summary.externalClicks} />
        <Kpi label="폼 제출" value={analytics.summary.formSubmits} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 유입 경로 */}
        <Card title="유입 경로 (utm_source)">
          {analytics.sources.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2.5">
              {analytics.sources.map((s) => (
                <li key={s.name} className="text-[13px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-fg">{s.name}</span>
                    <span className="text-fg-tertiary text-[11px]">
                      {s.count} · {s.percent}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-soft overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(2, s.percent)}%`,
                        background: "var(--brand-primary)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 인기 target */}
        <Card title="인기 클릭 대상">
          {analytics.topTargets.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2.5">
              {analytics.topTargets.map((t) => (
                <li
                  key={t.target}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-fg">
                    {TARGET_LABEL[t.target] ?? t.target}
                  </span>
                  <span className="text-fg-tertiary">{t.clicks} 회</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 디바이스 */}
        <Card title="디바이스">
          <div className="space-y-3 text-[13px]">
            <DeviceBar
              label="모바일"
              ratio={analytics.byDevice.mobile}
              color="var(--brand-primary)"
            />
            <DeviceBar
              label="데스크탑"
              ratio={analytics.byDevice.desktop}
              color="var(--color-info-text)"
            />
            {analytics.byDevice.other > 0 && (
              <DeviceBar
                label="기타"
                ratio={analytics.byDevice.other}
                color="var(--color-text-tertiary)"
              />
            )}
          </div>
        </Card>

        {/* 시간대 */}
        <Card title={`시간대별 방문 (피크 ${peakHour}시)`}>
          <div className="flex items-end gap-1 h-32">
            {analytics.byHour.map((v, h) => (
              <div
                key={h}
                className="flex-1 flex flex-col items-center justify-end h-full"
                title={`${h}시: ${v} 회`}
              >
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(v / maxHourVal) * 100}%`,
                    background:
                      h === peakHour
                        ? "var(--brand-primary)"
                        : "var(--color-border-secondary)",
                    minHeight: v > 0 ? "2px" : "0",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-fg-tertiary">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>23</span>
          </div>
        </Card>
      </div>

      {analytics.summary.comparison && (
        <p className="mt-6 text-[11px] text-fg-tertiary">
          이전 동일 기간({analytics.summary.comparison.totalViews}회) 대비{" "}
          <span
            className={
              analytics.summary.comparison.changePercent >= 0
                ? "text-success"
                : "text-danger"
            }
          >
            {analytics.summary.comparison.changePercent >= 0 ? "+" : ""}
            {analytics.summary.comparison.changePercent}%
          </span>
        </p>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta?: number;
}) {
  return (
    <div className="bg-bg rounded-lg border border-border-default p-4">
      <p className="text-[10px] uppercase tracking-wider text-fg-tertiary font-medium">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-medium text-fg leading-tight">
        {value.toLocaleString()}
      </p>
      {delta !== undefined && (
        <p
          className={`mt-0.5 text-[11px] ${
            delta >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
        </p>
      )}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg rounded-lg border border-border-default p-5">
      <h2 className="text-[12px] uppercase tracking-wider text-fg-tertiary mb-3 font-medium">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-[12px] text-fg-tertiary text-center py-6">
      해당 기간 데이터 없음
    </p>
  );
}

function DeviceBar({
  label,
  ratio,
  color,
}: {
  label: string;
  ratio: number;
  color: string;
}) {
  const pct = Math.round(ratio * 1000) / 10;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-fg">{label}</span>
        <span className="text-fg-tertiary text-[11px]">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-bg-soft overflow-hidden">
        <div
          className="h-full"
          style={{ width: `${Math.max(2, pct)}%`, background: color }}
        />
      </div>
    </div>
  );
}
