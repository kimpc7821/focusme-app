import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkAndIncrement, getClientIp } from "@/lib/rate-limit";

interface Body {
  pageId?: string;
  blockId?: string;
  values?: Record<string, string>;
  sessionId?: string;
}

const CONTACT_WINDOW_SECONDS = 60;
const CONTACT_MAX = 5;

/**
 * POST /api/v1/forms/contact — 공개 contact form 제출.
 * fire-and-forget. 항상 200 반환 (UX 막지 않음).
 * Rate limit — 같은 IP 1분 5회 초과 시 events insert 만 skip.
 *
 * MVP: events 테이블에 click 이벤트로 기록 (target=form_submit).
 *   recipient 이메일·카카오 알림 발송은 Phase 4 후속.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ data: { success: false } });
  }

  if (!body.pageId || !body.values || typeof body.values !== "object") {
    return NextResponse.json({ data: { success: false } });
  }

  const ip = getClientIp(request);
  const limit = await checkAndIncrement(
    `contact:${ip}`,
    CONTACT_WINDOW_SECONDS,
    CONTACT_MAX,
  );
  if (!limit.ok) {
    // 사용자에겐 성공처럼 응답 — 봇·스팸 발견 어렵게.
    // events 테이블에는 안 들어감.
    return NextResponse.json({ data: { success: true } });
  }

  try {
    const supabase = createServerSupabase();
    await supabase.from("events").insert({
      page_id: body.pageId,
      block_id: body.blockId ?? null,
      event_type: "click",
      target: "form_submit",
      session_id: body.sessionId ?? null,
    });
    // 실제 제출 내용 저장은 Phase 4 — contact_submissions 테이블 도입 시.
    // 현재는 카운트/유입 추적만.
  } catch {
    // 트래킹 실패가 UX 막으면 안 됨
  }

  return NextResponse.json({ data: { success: true } });
}
