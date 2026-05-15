import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyAdminNewChangeRequest } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

interface PostBody {
  description?: string;
}

/**
 * POST /api/v1/me/pages/:id/request-changes — /preview 에서 발행 전 수정 요청.
 *
 * 차이점 (`POST /change-requests` vs 이 endpoint):
 *   - /change-requests: 운영 중 큰 변경 의뢰 (block_add 등 type 필수)
 *   - /request-changes: 발행 전 미리보기 확인 단계의 수정 요청 (자유 텍스트)
 *
 * 동작:
 *   1) 소유권 + work_tasks.status='client_review' 검증
 *   2) change_requests INSERT (type=other)
 *   3) 직원 알림 (TPL_012)
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §5.1
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const description = (body.description ?? "").trim();
  if (description.length < 3) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "수정 내용을 입력해주세요 (최소 3자)",
        },
      },
      { status: 400 },
    );
  }
  if (description.length > 2000) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "수정 내용은 2000자 이하로 입력해주세요",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: task } = await supabase
    .from("work_tasks")
    .select("status")
    .eq("page_id", pageId)
    .maybeSingle();
  if (!task || task.status !== "client_review") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATE",
          message: "미리보기 단계에서만 수정 요청할 수 있습니다",
        },
      },
      { status: 409 },
    );
  }

  const { data: cr, error: insErr } = await supabase
    .from("change_requests")
    .insert({
      page_id: pageId,
      request_type: "other",
      description: `[발행 전 수정] ${description}`,
      status: "pending",
    })
    .select()
    .single();

  if (insErr || !cr) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: insErr?.message ?? "기록 실패",
        },
      },
      { status: 500 },
    );
  }

  // 직원 알림
  try {
    const { data: client } = await supabase
      .from("clients")
      .select("business_name")
      .eq("id", auth.sub)
      .maybeSingle();
    await notifyAdminNewChangeRequest({
      pageId,
      pageSlug: owns.slug,
      businessName: client?.business_name ?? null,
      requestType: "preview_revision",
      description,
    });
  } catch (err) {
    console.warn("[notify] preview request-changes 실패:", err);
  }

  return NextResponse.json(
    { data: { changeRequest: cr } },
    { status: 201 },
  );
}
