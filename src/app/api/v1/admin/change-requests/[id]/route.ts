import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyClientChangeRequestUpdate } from "@/lib/notifications/stub";

interface Params {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  status?: string;
  quotedCost?: number | null;
  note?: string | null;
}

const VALID_STATUS = new Set([
  "pending",
  "quoted",
  "in_progress",
  "completed",
  "rejected",
]);

/**
 * PATCH /api/v1/admin/change-requests/:id — 변경 요청 처리.
 * reference: docs/focusme-api-spec.md §4.19
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const updates: {
    status?: string;
    quoted_cost?: number | null;
    quoted_at?: string | null;
    completed_at?: string | null;
    notes?: string | null;
  } = {};

  if (body.status !== undefined) {
    if (!VALID_STATUS.has(body.status)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `status 는 다음 중 하나: ${[...VALID_STATUS].join(", ")}`,
          },
        },
        { status: 400 },
      );
    }
    updates.status = body.status;
    if (body.status === "quoted") updates.quoted_at = new Date().toISOString();
    if (body.status === "completed")
      updates.completed_at = new Date().toISOString();
  }
  if (body.quotedCost !== undefined) updates.quoted_cost = body.quotedCost;
  if (body.note !== undefined) updates.notes = body.note;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "변경할 필드 없음" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: cr, error } = await supabase
    .from("change_requests")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !cr) {
    return NextResponse.json(
      {
        error: {
          code: error ? "INTERNAL_ERROR" : "NOT_FOUND",
          message: error?.message ?? "요청이 없습니다",
        },
      },
      { status: error ? 500 : 404 },
    );
  }

  // 클라이언트 알림 (status 변경 시) — NHN Toast 알림톡으로 교체 예정.
  if (body.status) {
    const { data: page } = await supabase
      .from("pages")
      .select("slug, client_id")
      .eq("id", cr.page_id)
      .maybeSingle();
    let clientPhone: string | null = null;
    if (page?.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("phone")
        .eq("id", page.client_id)
        .maybeSingle();
      clientPhone = client?.phone ?? null;
    }
    await notifyClientChangeRequestUpdate({
      clientPhone,
      pageSlug: page?.slug ?? "?",
      status: body.status,
      quotedCost: cr.quoted_cost,
      note: cr.notes,
    });
  }

  return NextResponse.json({ data: { changeRequest: cr } });
}
