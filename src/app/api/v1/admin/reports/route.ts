import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPageAnalytics } from "@/lib/db/analytics";
import { generateInsight } from "@/lib/ai/anthropic";

interface CreateBody {
  pageId?: string;
  clientId?: string;
  periodStart?: string;
  periodEnd?: string;
}

/**
 * POST /api/v1/admin/reports — 분기 리포트 생성.
 * pageId 또는 clientId 둘 중 하나로 호출. 둘 다면 pageId 우선.
 * 동작: analytics 스냅샷 + Claude Haiku 인사이트 한 문단 + reports INSERT.
 * reference: docs/focusme-api-spec.md §4.15
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body.pageId && !body.clientId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "pageId 또는 clientId 가 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const periodEnd = body.periodEnd ? new Date(body.periodEnd) : new Date();
  const periodStart = body.periodStart
    ? new Date(body.periodStart)
    : new Date(periodEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (
    isNaN(periodStart.getTime()) ||
    isNaN(periodEnd.getTime()) ||
    periodStart >= periodEnd
  ) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 기간" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();

  // 페이지 + 클라이언트 정보
  const pageId = body.pageId ?? null;
  let clientId = body.clientId ?? null;
  let businessName = "";
  let businessType = "";

  if (pageId) {
    const { data: page } = await supabase
      .from("pages")
      .select("id, client_id")
      .eq("id", pageId)
      .maybeSingle();
    if (!page) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
        { status: 404 },
      );
    }
    clientId = page.client_id;
  }

  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("business_name, business_type")
      .eq("id", clientId)
      .maybeSingle();
    if (client) {
      businessName = client.business_name ?? "";
      businessType = client.business_type ?? "";
    }
  }

  // analytics 스냅샷 — pageId 가 있어야만 의미 있음
  if (!pageId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "현재는 pageId 단위 리포트만 지원합니다",
        },
      },
      { status: 400 },
    );
  }

  const analytics = await getPageAnalytics({
    pageId,
    from: periodStart,
    to: periodEnd,
  });

  // AI 인사이트
  let aiInsight: string | null = null;
  let insightCostKrw = 0;
  try {
    const insight = await generateInsight({
      businessName,
      businessType,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      summary: analytics.summary,
      topSources: analytics.sources.slice(0, 5).map((s) => ({
        name: s.name,
        percent: s.percent,
      })),
      topTargets: analytics.topTargets.slice(0, 5).map((t) => ({
        target: t.target,
        clicks: t.clicks,
      })),
      byDevice: {
        mobile: analytics.byDevice.mobile,
        desktop: analytics.byDevice.desktop,
      },
    });
    aiInsight = insight.text;
    insightCostKrw = insight.costKrw;
  } catch (err) {
    // AI 실패해도 리포트 자체는 저장 (인사이트만 null)
    aiInsight = null;
    insightCostKrw = 0;
    console.error("[reports] insight failed:", err);
  }

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      client_id: clientId!,
      page_id: pageId,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      data_snapshot: analytics as unknown as Record<string, unknown>,
      ai_insight: aiInsight,
      status: "draft",
    })
    .select()
    .single();
  if (error || !report) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message ?? "리포트 저장 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { data: { report, insightCostKrw } },
    { status: 201 },
  );
}

/**
 * GET /api/v1/admin/reports?pageId=...&clientId=...
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId");
  const clientId = url.searchParams.get("clientId");

  const supabase = createServerSupabase();
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (pageId) query = query.eq("page_id", pageId);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: data ?? [] });
}
