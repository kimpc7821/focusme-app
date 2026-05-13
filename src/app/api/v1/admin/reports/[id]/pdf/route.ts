import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { ReportDocument } from "@/lib/pdf/report-document";

interface Params {
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

/**
 * GET /api/v1/admin/reports/:id/pdf — A4 1장 PDF 다운로드.
 * @react-pdf/renderer 로 서버 측 PDF 생성. Pretendard 한국어 폰트.
 * reference: docs/focusme-api-spec.md §4.16
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!report) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "리포트가 없습니다" } },
      { status: 404 },
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("business_name, business_type")
    .eq("id", report.client_id)
    .maybeSingle();
  const { data: page } = report.page_id
    ? await supabase
        .from("pages")
        .select("slug")
        .eq("id", report.page_id)
        .maybeSingle()
    : { data: null };

  const snapshot = (report.data_snapshot ?? {}) as Snapshot;

  const buffer = await renderToBuffer(
    ReportDocument({
      businessName: client?.business_name ?? "-",
      businessType: client?.business_type ?? "-",
      periodStart: report.period_start,
      periodEnd: report.period_end,
      pageSlug: page?.slug ?? "-",
      reportId: report.id,
      generatedAt: new Date(report.created_at).toLocaleString("ko-KR"),
      aiInsight: report.ai_insight,
      summary: snapshot.summary ?? {
        totalViews: 0,
        uniqueSessions: 0,
        kakaoClicks: 0,
        phoneClicks: 0,
        externalClicks: 0,
        formSubmits: 0,
      },
      sources: snapshot.sources ?? [],
      topTargets: snapshot.topTargets ?? [],
      byDevice: snapshot.byDevice ?? { mobile: 0, desktop: 0, other: 0 },
    }),
  );

  const filename = `focusme-report-${report.id.slice(0, 8)}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
