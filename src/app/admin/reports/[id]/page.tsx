import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

interface Snapshot {
  range?: { from: string; to: string };
  summary?: {
    totalViews: number;
    uniqueSessions: number;
    kakaoClicks: number;
    phoneClicks: number;
    externalClicks: number;
    formSubmits: number;
    comparison?: { totalViews: number; changePercent: number };
  };
  sources?: Array<{ name: string; count: number; percent: number }>;
  topTargets?: Array<{ target: string; clicks: number }>;
  byDevice?: { mobile: number; desktop: number; other: number };
}

const TARGET_LABEL: Record<string, string> = {
  kakao: "카톡 채널",
  phone: "전화",
  external_link: "외부 링크",
  form_submit: "폼 제출",
};

function fmt(n: number) {
  return n.toLocaleString();
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!report) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("business_name, business_type")
    .eq("id", report.client_id)
    .maybeSingle();

  const { data: page } = report.page_id
    ? await supabase
        .from("pages")
        .select("slug, status")
        .eq("id", report.page_id)
        .maybeSingle()
    : { data: null };

  const snapshot = (report.data_snapshot ?? {}) as Snapshot;
  const summary = snapshot.summary;
  const comparison = summary?.comparison;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/admin/tasks" className="hover:text-fg">
          작업 큐
        </Link>
        <span className="mx-2">/</span>
        <span>리포트</span>
      </nav>

      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-fg leading-tight">
            {client?.business_name ?? "-"} 분기 리포트
          </h1>
          <p className="mt-1 text-[12px] text-fg-tertiary">
            {report.period_start} ~ {report.period_end}
            {page && (
              <>
                <span className="mx-2">·</span>
                <span className="font-mono">/{page.slug}</span>
              </>
            )}
            <span className="mx-2">·</span>
            {report.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report.page_id && (
            <Link
              href={`/admin/pages/${report.page_id}/analytics?from=${report.period_start}&to=${report.period_end}`}
              className="text-[12px] text-info hover:underline"
            >
              ← 분석 페이지로
            </Link>
          )}
          <a
            href={`/api/v1/admin/reports/${report.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-md text-[12px] font-medium hover:opacity-90"
            style={{
              background: "var(--brand-primary)",
              color: "var(--brand-primary-text)",
            }}
          >
            ↓ PDF 다운로드
          </a>
        </div>
      </div>

      {/* AI 인사이트 */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{
          background: "var(--color-ai-bg)",
          border: "0.5px solid var(--color-ai-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-ai-text)" }}>
          <span>✦</span>
          AI 인사이트
        </div>
        <p className="text-[14px] leading-relaxed text-fg whitespace-pre-wrap">
          {report.ai_insight || "(인사이트 생성 실패 — 데이터만 확인하세요)"}
        </p>
      </div>

      {/* 핵심 KPI */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Kpi
            label="총 방문"
            value={summary.totalViews}
            delta={comparison?.changePercent}
          />
          <Kpi label="유니크 세션" value={summary.uniqueSessions} />
          <Kpi label="카톡 클릭" value={summary.kakaoClicks} />
          <Kpi label="전화 클릭" value={summary.phoneClicks} />
          <Kpi label="외부 링크" value={summary.externalClicks} />
          <Kpi label="폼 제출" value={summary.formSubmits} />
        </div>
      )}

      {comparison && (
        <p className="mb-6 text-[12px] text-fg-tertiary">
          이전 동일 기간({fmt(comparison.totalViews)}회) 대비{" "}
          <span
            className={
              comparison.changePercent >= 0 ? "text-success" : "text-danger"
            }
          >
            {comparison.changePercent >= 0 ? "+" : ""}
            {comparison.changePercent}%
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="유입 경로">
          {snapshot.sources && snapshot.sources.length > 0 ? (
            <ul className="space-y-2 text-[13px]">
              {snapshot.sources.slice(0, 8).map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-fg">{s.name}</span>
                  <span className="text-fg-tertiary">
                    {fmt(s.count)} · {s.percent}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="인기 클릭 대상">
          {snapshot.topTargets && snapshot.topTargets.length > 0 ? (
            <ul className="space-y-2 text-[13px]">
              {snapshot.topTargets.map((t) => (
                <li
                  key={t.target}
                  className="flex items-center justify-between"
                >
                  <span className="text-fg">
                    {TARGET_LABEL[t.target] ?? t.target}
                  </span>
                  <span className="text-fg-tertiary">{t.clicks}회</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="디바이스 분포">
          {snapshot.byDevice ? (
            <div className="space-y-2 text-[13px]">
              <Row
                label="모바일"
                value={`${Math.round(snapshot.byDevice.mobile * 100)}%`}
              />
              <Row
                label="데스크탑"
                value={`${Math.round(snapshot.byDevice.desktop * 100)}%`}
              />
              {snapshot.byDevice.other > 0 && (
                <Row
                  label="기타"
                  value={`${Math.round(snapshot.byDevice.other * 100)}%`}
                />
              )}
            </div>
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="발송 상태">
          <ul className="text-[12px] text-fg-secondary space-y-1">
            <li>
              상태: <span className="text-fg font-medium">{report.status}</span>
            </li>
            <li>
              생성:{" "}
              {report.created_at &&
                new Date(report.created_at).toLocaleString("ko-KR")}
            </li>
            {report.sent_at && (
              <li>
                발송: {new Date(report.sent_at).toLocaleString("ko-KR")} (
                {report.sent_via})
              </li>
            )}
            {!report.sent_at && (
              <li className="text-fg-tertiary">미발송 (PDF·알림톡 Phase 후속)</li>
            )}
          </ul>
        </Card>
      </div>
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
      <p className="mt-1 text-[20px] font-medium text-fg leading-tight">
        {fmt(value)}
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
      <h2 className="text-[10px] uppercase tracking-wider text-fg-tertiary mb-3 font-medium">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-[12px] text-fg-tertiary text-center py-4">
      데이터 없음
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg">{label}</span>
      <span className="text-fg-tertiary">{value}</span>
    </div>
  );
}
