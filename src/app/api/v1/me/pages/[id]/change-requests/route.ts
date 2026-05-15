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

interface CreateBody {
  requestType?: string;
  description?: string;
}

const VALID_TYPES = new Set([
  "block_add",
  "block_remove",
  "design_change",
  "template_change",
  "other",
]);

/**
 * GET /api/v1/me/pages/:id/change-requests — 사장님이 낸 변경 요청 목록.
 * spec 에는 명시 없으나 UX 상 필요 (제출 후 진행 상태 확인).
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("change_requests")
    .select("*")
    .eq("page_id", pageId)
    .order("submitted_at", { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/v1/me/pages/:id/change-requests — 큰 변경 의뢰 등록.
 * reference: docs/focusme-api-spec.md §3.9
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const requestType = body.requestType?.trim();
  const description = body.description?.trim();

  if (!requestType || !VALID_TYPES.has(requestType)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `requestType 은 다음 중 하나: ${[...VALID_TYPES].join(", ")}`,
        },
      },
      { status: 400 },
    );
  }
  if (!description) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "description 이 필요합니다",
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
          message: "description 은 2000자 이하로 입력해주세요",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: cr, error } = await supabase
    .from("change_requests")
    .insert({
      page_id: pageId,
      request_type: requestType,
      description,
      status: "pending",
    })
    .select()
    .single();
  if (error || !cr) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message ?? "기록 실패",
        },
      },
      { status: 500 },
    );
  }

  // 직원 알림 (NHN Toast 통합 시 알림톡 발송으로 교체).
  const { data: client } = await supabase
    .from("clients")
    .select("business_name")
    .eq("id", auth.sub)
    .maybeSingle();
  await notifyAdminNewChangeRequest({
    pageId,
    pageSlug: owns.slug,
    businessName: client?.business_name ?? null,
    requestType,
    description,
  });

  return NextResponse.json({ data: { changeRequest: cr } }, { status: 201 });
}
