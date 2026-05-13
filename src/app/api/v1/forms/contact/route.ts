import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

interface Body {
  pageId?: string;
  blockId?: string;
  values?: Record<string, string>;
  sessionId?: string;
}

/**
 * POST /api/v1/forms/contact — 공개 contact form 제출.
 * fire-and-forget 형태.
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
