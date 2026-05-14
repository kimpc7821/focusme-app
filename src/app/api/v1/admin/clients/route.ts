import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

const VALID_STATUS = new Set(["active", "inactive", "deleted"]);
const VALID_PAYMENT = new Set([
  "pending",
  "invoiced",
  "paid",
  "refunded",
  "cancelled",
]);

/**
 * GET /api/v1/admin/clients?status=active&paymentStatus=paid&page=1&limit=20&q=노을
 * reference: docs/focusme-api-spec.md §4.20
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const paymentStatus = url.searchParams.get("paymentStatus");
  const q = url.searchParams.get("q")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 20)),
  );
  const offset = (page - 1) * limit;

  if (status && !VALID_STATUS.has(status)) {
    return NextResponse.json(
      {
        error: { code: "VALIDATION_ERROR", message: "유효하지 않은 status" },
      },
      { status: 400 },
    );
  }
  if (paymentStatus && !VALID_PAYMENT.has(paymentStatus)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "유효하지 않은 paymentStatus",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  let query = supabase
    .from("clients")
    .select(
      "id, phone, kakao_id, email, business_name, business_type, signup_date, status, payment_status, paid_at, payment_amount",
      { count: "exact" },
    )
    .order("signup_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);
  if (q) {
    // business_name OR phone OR email partial match
    query = query.or(
      `business_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

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
