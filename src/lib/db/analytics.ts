import { createServerSupabase } from "@/lib/supabase/server";

export interface AnalyticsSummary {
  totalViews: number;
  uniqueSessions: number;
  kakaoClicks: number;
  phoneClicks: number;
  externalClicks: number;
  formSubmits: number;
  comparison?: {
    totalViews: number;
    changePercent: number;
  };
}

export interface SourceRow {
  name: string;
  count: number;
  percent: number;
}

export interface TargetRow {
  target: string;
  clicks: number;
}

export interface DeviceShare {
  mobile: number;
  desktop: number;
  other: number;
}

export interface AnalyticsResult {
  range: { from: string; to: string };
  summary: AnalyticsSummary;
  sources: SourceRow[];
  topTargets: TargetRow[];
  byDevice: DeviceShare;
  byHour: number[]; // 24개 (0..23 시)
}

interface EventRow {
  event_type: string;
  target: string | null;
  session_id: string | null;
  utm_source: string | null;
  device: string | null;
  ts: string;
}

const CLICK_TARGETS = new Set([
  "kakao",
  "phone",
  "external_link",
  "form_submit",
]);

async function fetchEvents(
  pageId: string,
  from: Date,
  to: Date,
): Promise<EventRow[]> {
  const supabase = createServerSupabase();
  const out: EventRow[] = [];
  let cursorTs: string | null = null;
  const pageSize = 1000;
  // 페이지네이션 — 너무 큰 페이지는 50000 까지만
  for (let i = 0; i < 50; i++) {
    let query = supabase
      .from("events")
      .select("event_type, target, session_id, utm_source, device, ts")
      .eq("page_id", pageId)
      .gte("ts", from.toISOString())
      .lt("ts", to.toISOString())
      .order("ts", { ascending: true })
      .limit(pageSize);
    if (cursorTs) query = query.gt("ts", cursorTs);

    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    out.push(...(data as EventRow[]));
    if (data.length < pageSize) break;
    cursorTs = data[data.length - 1].ts;
  }
  return out;
}

function aggregate(events: EventRow[]): Omit<AnalyticsResult, "range" | "summary"> & {
  summary: Omit<AnalyticsSummary, "comparison">;
} {
  let totalViews = 0;
  const viewSessions = new Set<string>();
  let kakao = 0;
  let phone = 0;
  let external = 0;
  let forms = 0;

  const sourcesMap = new Map<string, number>();
  const targetsMap = new Map<string, number>();
  const deviceMap = { mobile: 0, desktop: 0, other: 0 };
  const byHour = new Array<number>(24).fill(0);

  for (const e of events) {
    if (e.event_type === "view") {
      totalViews++;
      if (e.session_id) viewSessions.add(e.session_id);
      const source = e.utm_source ?? "direct";
      sourcesMap.set(source, (sourcesMap.get(source) ?? 0) + 1);

      if (e.device === "mobile") deviceMap.mobile++;
      else if (e.device === "desktop") deviceMap.desktop++;
      else deviceMap.other++;

      const hour = new Date(e.ts).getHours();
      if (hour >= 0 && hour < 24) byHour[hour]++;
    } else if (e.event_type === "click") {
      if (e.target === "kakao") kakao++;
      else if (e.target === "phone") phone++;
      else if (e.target === "external_link") external++;
      else if (e.target === "form_submit") forms++;
      if (e.target && CLICK_TARGETS.has(e.target)) {
        targetsMap.set(e.target, (targetsMap.get(e.target) ?? 0) + 1);
      } else if (e.target) {
        // 그 외 target도 카운트 (예: product_xxx)
        targetsMap.set(e.target, (targetsMap.get(e.target) ?? 0) + 1);
      }
    }
  }

  const totalViewsForPercent = totalViews || 1;
  const sources: SourceRow[] = Array.from(sourcesMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / totalViewsForPercent) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const topTargets: TargetRow[] = Array.from(targetsMap.entries())
    .map(([target, clicks]) => ({ target, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const deviceTotal =
    deviceMap.mobile + deviceMap.desktop + deviceMap.other || 1;
  const byDevice: DeviceShare = {
    mobile: Math.round((deviceMap.mobile / deviceTotal) * 1000) / 1000,
    desktop: Math.round((deviceMap.desktop / deviceTotal) * 1000) / 1000,
    other: Math.round((deviceMap.other / deviceTotal) * 1000) / 1000,
  };

  return {
    summary: {
      totalViews,
      uniqueSessions: viewSessions.size,
      kakaoClicks: kakao,
      phoneClicks: phone,
      externalClicks: external,
      formSubmits: forms,
    },
    sources,
    topTargets,
    byDevice,
    byHour,
  };
}

export async function getPageAnalytics(args: {
  pageId: string;
  from: Date;
  to: Date;
}): Promise<AnalyticsResult> {
  const events = await fetchEvents(args.pageId, args.from, args.to);
  const agg = aggregate(events);

  // 이전 동일 기간 비교 (totalViews 만)
  const rangeMs = args.to.getTime() - args.from.getTime();
  const prevTo = args.from;
  const prevFrom = new Date(args.from.getTime() - rangeMs);
  let prevTotalViews: number | null = null;
  if (rangeMs > 0) {
    const prevEvents = await fetchEvents(args.pageId, prevFrom, prevTo);
    prevTotalViews = prevEvents.filter((e) => e.event_type === "view").length;
  }

  const comparison =
    prevTotalViews !== null
      ? {
          totalViews: prevTotalViews,
          changePercent:
            prevTotalViews === 0
              ? agg.summary.totalViews > 0
                ? 100
                : 0
              : Math.round(
                  ((agg.summary.totalViews - prevTotalViews) /
                    prevTotalViews) *
                    1000,
                ) / 10,
        }
      : undefined;

  return {
    range: {
      from: args.from.toISOString(),
      to: args.to.toISOString(),
    },
    summary: { ...agg.summary, comparison },
    sources: agg.sources,
    topTargets: agg.topTargets,
    byDevice: agg.byDevice,
    byHour: agg.byHour,
  };
}
