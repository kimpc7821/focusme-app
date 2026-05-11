import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/v1/track — 공개 트래킹 endpoint (fire-and-forget).
 *
 * 정책 (docs/focusme-api-spec.md §2.2):
 *  - 트래킹 실패가 UX 막으면 안 되므로 에러도 200 반환.
 *  - 비동기 큐는 MVP에서 단순 supabase INSERT 로 대체.
 *  - IP는 서버에서 마스킹 (현재는 미수집).
 */

interface TrackBody {
  pageId?: string;
  blockId?: string;
  eventType?: "view" | "click" | "scroll_reach" | "dwell";
  target?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  device?: "mobile" | "desktop";
  sessionId?: string;
}

const ALLOWED_EVENTS = new Set([
  "view",
  "click",
  "scroll_reach",
  "dwell",
]);

export async function POST(request: Request) {
  let body: TrackBody;
  try {
    body = (await request.json()) as TrackBody;
  } catch {
    return NextResponse.json({ data: { success: false } });
  }

  if (!body.pageId || !body.eventType || !ALLOWED_EVENTS.has(body.eventType)) {
    return NextResponse.json({ data: { success: false } });
  }

  try {
    const supabase = createServerSupabase();
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

    await supabase.from("events").insert({
      page_id: body.pageId,
      block_id: body.blockId ?? null,
      event_type: body.eventType,
      target: body.target ?? null,
      session_id: body.sessionId ?? null,
      utm_source: body.utmSource ?? null,
      utm_medium: body.utmMedium ?? null,
      utm_campaign: body.utmCampaign ?? null,
      utm_content: body.utmContent ?? null,
      utm_term: body.utmTerm ?? null,
      referrer: body.referrer ?? null,
      device: body.device ?? null,
      user_agent: userAgent,
    });
  } catch {
    // fire-and-forget — UX 막으면 안 됨
  }

  return NextResponse.json({ data: { success: true } });
}
