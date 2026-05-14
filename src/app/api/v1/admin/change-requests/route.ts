import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

const VALID_STATUS = new Set([
  "pending",
  "quoted",
  "in_progress",
  "completed",
  "rejected",
]);

/**
 * GET /api/v1/admin/change-requests?status=pending&page=1&limit=20
 * reference: docs/focusme-api-spec.md §4.18
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 20)),
  );
  const offset = (page - 1) * limit;

  if (status && !VALID_STATUS.has(status)) {
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

  const supabase = createServerSupabase();
  let query = supabase
    .from("change_requests")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
