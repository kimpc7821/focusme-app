import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyAdminClientApproved } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/me/pages/:id/approve — 사장님 "이대로 발행" 1탭.
 *
 * 동작:
 *   1) 소유권·status 검증 — work_tasks.status='client_review' 만 가능
 *   2) work_tasks.client_approved_at = NOW()
 *   3) 직원 알림 (TPL_013 신규)
 *
 * 발행 자체는 직원이 admin 에서 처리 (자동 발행 아님).
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §2 [5] + §11 A4
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  const supabase = createServerSupabase();
  const { data: task } = await supabase
    .from("work_tasks")
    .select("id, status, client_approved_at")
    .eq("page_id", pageId)
    .maybeSingle();

  if (!task) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "작업 정보가 없습니다" } },
      { status: 404 },
    );
  }

  if (task.status !== "client_review") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATE",
          message: `현재 단계에서는 발행 요청할 수 없습니다 (현재: ${task.status})`,
        },
      },
      { status: 409 },
    );
  }

  if (task.client_approved_at) {
    return NextResponse.json({
      data: {
        success: true,
        alreadyApproved: true,
        approvedAt: task.client_approved_at,
      },
    });
  }

  const approvedAt = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("work_tasks")
    .update({ client_approved_at: approvedAt })
    .eq("id", task.id);

  if (updErr) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: updErr.message } },
      { status: 500 },
    );
  }

  // 직원 알림 (선택적 — 실패해도 approve 자체는 성공)
  try {
    const { data: client } = await supabase
      .from("clients")
      .select("business_name")
      .eq("id", auth.sub)
      .maybeSingle();
    await notifyAdminClientApproved({
      businessName: client?.business_name ?? owns.slug,
      pageSlug: owns.slug,
    });
  } catch (err) {
    console.warn("[notify] client_approved 실패:", err);
  }

  return NextResponse.json({
    data: { success: true, approvedAt },
  });
}
