"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPageAnalytics } from "@/lib/db/analytics";
import { generateInsight } from "@/lib/ai/anthropic";

export interface GenerateReportInput {
  pageId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
}

export async function createReportAction(formData: FormData): Promise<void> {
  const pageId = String(formData.get("pageId") ?? "");
  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");

  const backUrl = `/admin/pages/${pageId}/analytics?from=${periodStart}&to=${periodEnd}`;

  if (!pageId || !periodStart || !periodEnd) {
    redirect(`${backUrl}&error=missing`);
  }
  const from = new Date(periodStart);
  const to = new Date(periodEnd);
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
    redirect(`${backUrl}&error=range`);
  }

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, client_id")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) redirect(`${backUrl}&error=notfound`);

  const clientRow = page
    ? (
        await supabase
          .from("clients")
          .select("business_name, business_type")
          .eq("id", page.client_id)
          .maybeSingle()
      ).data
    : null;
  const client = clientRow;

  const analytics = await getPageAnalytics({ pageId, from, to });

  let aiInsight: string | null = null;
  try {
    const insight = await generateInsight({
      businessName: client?.business_name ?? "",
      businessType: client?.business_type ?? "",
      periodStart,
      periodEnd,
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
  } catch (err) {
    console.error("[reports] insight failed:", err);
  }

  const { data: report } = await supabase
    .from("reports")
    .insert({
      client_id: page!.client_id,
      page_id: pageId,
      period_start: periodStart,
      period_end: periodEnd,
      data_snapshot: analytics as unknown as Record<string, unknown>,
      ai_insight: aiInsight,
      status: "draft",
    })
    .select()
    .single();

  if (!report) redirect(`${backUrl}&error=save`);
  redirect(`/admin/reports/${report!.id}`);
}
