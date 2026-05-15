import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

interface Counts {
  newTasks: number;
  inReview: number;
  clientReview: number;
  pendingRequests: number;
  pendingPayments: number;
  publishedPages: number;
  recentReports: number;
}

async function getCounts(): Promise<Counts> {
  const supabase = createServerSupabase();

  const [
    { count: newTasks },
    { count: inReview },
    { count: clientReview },
    { count: pendingRequests },
    { count: pendingPayments },
    { count: publishedPages },
  ] = await Promise.all([
    supabase
      .from("work_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("work_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_review"),
    supabase
      .from("work_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "client_review"),
    supabase
      .from("change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["pending", "invoiced"]),
    supabase
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  // 최근 7일 생성된 리포트
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentReports } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenAgo);

  return {
    newTasks: newTasks ?? 0,
    inReview: inReview ?? 0,
    clientReview: clientReview ?? 0,
    pendingRequests: pendingRequests ?? 0,
    pendingPayments: pendingPayments ?? 0,
    publishedPages: publishedPages ?? 0,
    recentReports: recentReports ?? 0,
  };
}

export default async function AdminHomePage() {
  const c = await getCounts();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          오늘 처리할 일
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          작업 큐·변경 요청·결제 현황을 한눈에.
        </p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI
          href="/admin/tasks?status=new"
          label="신규 작업"
          count={c.newTasks}
          accent={c.newTasks > 0 ? "warn" : "neutral"}
        />
        <KPI
          href="/admin/tasks?status=in_review"
          label="검수 중"
          count={c.inReview}
          accent="neutral"
        />
        <KPI
          href="/admin/tasks?status=client_review"
          label="고객 확인 대기"
          count={c.clientReview}
          accent="neutral"
        />
        <KPI
          href="/admin/change-requests?status=pending"
          label="변경 요청"
          count={c.pendingRequests}
          accent={c.pendingRequests > 0 ? "warn" : "neutral"}
        />
        <KPI
          href="/admin/clients?paymentStatus=pending"
          label="미결제"
          count={c.pendingPayments}
          accent={c.pendingPayments > 0 ? "warn" : "neutral"}
        />
        <KPI
          href="/admin/clients"
          label="공개 중 페이지"
          count={c.publishedPages}
          accent="success"
        />
        <KPI
          href="/admin/reports"
          label="최근 7일 리포트"
          count={c.recentReports}
          accent="neutral"
        />
        <KPI
          href="/admin/pages/new"
          label="+ 새 페이지"
          count={null}
          accent="info"
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuickCard
          href="/admin/tasks"
          title="작업 큐"
          desc="신규 → AI 생성 → 검수 → 고객 확인 → 완료 흐름 관리"
        />
        <QuickCard
          href="/admin/clients"
          title="클라이언트"
          desc="가입한 사장님 목록·결제 매뉴얼 관리"
        />
        <QuickCard
          href="/admin/change-requests"
          title="변경 요청"
          desc="사장님 큰 변경 의뢰 큐. 견적 회신·진행·완료 처리"
        />
        <QuickCard
          href="/admin/reports"
          title="분석 리포트"
          desc="기간별 분석 리포트 생성·PDF 다운로드"
        />
      </section>
    </div>
  );
}

function KPI({
  href,
  label,
  count,
  accent,
}: {
  href: string;
  label: string;
  count: number | null;
  accent: "neutral" | "warn" | "success" | "info";
}) {
  const accentCls = {
    neutral: "border-border-default text-fg",
    warn: "border-ai-soft text-ai-text-token",
    success: "border-success-soft text-success",
    info: "border-info-soft text-info",
  }[accent];

  return (
    <Link
      href={href}
      className={`block bg-bg rounded-lg border ${accentCls} px-4 py-3 hover:bg-bg-soft transition-colors`}
    >
      <p className="text-[10px] uppercase tracking-wider text-fg-tertiary font-medium">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-medium leading-none">
        {count == null ? "→" : count}
      </p>
    </Link>
  );
}

function QuickCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-bg rounded-lg border border-border-default p-5 hover:bg-bg-soft transition-colors"
    >
      <h3 className="text-[14px] font-medium text-fg">{title}</h3>
      <p className="mt-1 text-[11px] text-fg-tertiary leading-relaxed">
        {desc}
      </p>
    </Link>
  );
}
