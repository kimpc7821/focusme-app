import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyAdminNewTask } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/me/pages/:id/submit — Step 3 제출.
 *
 * 동작:
 *   1) 소유권·status 검증 — work_tasks.status='new' 만 제출 가능
 *   2) work_tasks.status: new → in_review
 *   3) 직원 알림 (TPL_010 NEW_TASK — 이미 페이지 생성 시 한 번 보냈지만, 사장님 자료 제출 시점에도 다시 알림)
 *
 * 사장님은 이후 work_tasks.client_review 알림 받을 때까지 대기.
 * reference: docs/focusme-flow-simplification-guide-v2.md §2 [3] + §5.1
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
    .select("id, status")
    .eq("page_id", pageId)
    .maybeSingle();

  if (!task) {
    return NextResponse.json(
      {
        error: { code: "NOT_FOUND", message: "작업 정보가 없습니다" },
      },
      { status: 404 },
    );
  }

  if (task.status !== "new") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATE",
          message: `이미 제출했거나 진행 중입니다 (현재 상태: ${task.status})`,
        },
      },
      { status: 409 },
    );
  }

  const { error: updErr } = await supabase
    .from("work_tasks")
    .update({ status: "in_review" })
    .eq("id", task.id);

  if (updErr) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: updErr.message } },
      { status: 500 },
    );
  }

  // 직원 알림 (선택적 — 실패해도 제출 자체는 성공)
  try {
    const { data: client } = await supabase
      .from("clients")
      .select("business_name, business_type")
      .eq("id", auth.sub)
      .maybeSingle();
    await notifyAdminNewTask({
      businessName: client?.business_name ?? owns.slug,
      businessType: client?.business_type ?? "",
    });
  } catch (err) {
    console.warn("[notify] submit new_task 실패:", err);
  }

  return NextResponse.json({
    data: {
      success: true,
      taskId: task.id,
      status: "in_review",
    },
  });
}
