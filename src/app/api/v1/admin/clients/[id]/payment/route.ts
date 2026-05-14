import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  paymentStatus?: string;
  amount?: number | null;
  invoiceNumber?: string | null;
  paidAt?: string | null;
  invoicedAt?: string | null;
}

const VALID_STATUS = new Set([
  "pending",
  "invoiced",
  "paid",
  "refunded",
  "cancelled",
]);

/**
 * PATCH /api/v1/admin/clients/:id/payment — 결제 매뉴얼 처리.
 * reference: docs/focusme-api-spec.md §4.22
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
    payment_status?: string;
    payment_amount?: number | null;
    invoice_number?: string | null;
    paid_at?: string | null;
    invoiced_at?: string | null;
  } = {};

  if (body.paymentStatus !== undefined) {
    if (!VALID_STATUS.has(body.paymentStatus)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `paymentStatus 는 다음 중 하나: ${[...VALID_STATUS].join(", ")}`,
          },
        },
        { status: 400 },
      );
    }
    updates.payment_status = body.paymentStatus;
    // 상태 전환 시 timestamp 자동 채우기 (사용자가 명시하지 않은 경우만).
    if (body.paymentStatus === "invoiced" && body.invoicedAt === undefined) {
      updates.invoiced_at = new Date().toISOString();
    }
    if (body.paymentStatus === "paid" && body.paidAt === undefined) {
      updates.paid_at = new Date().toISOString();
    }
  }
  if (body.amount !== undefined) updates.payment_amount = body.amount;
  if (body.invoiceNumber !== undefined)
    updates.invoice_number = body.invoiceNumber;
  if (body.paidAt !== undefined) updates.paid_at = body.paidAt;
  if (body.invoicedAt !== undefined) updates.invoiced_at = body.invoicedAt;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "변경할 필드 없음" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: client, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select(
      "id, payment_status, payment_amount, invoice_number, invoiced_at, paid_at",
    )
    .maybeSingle();
  if (error || !client) {
    return NextResponse.json(
      {
        error: {
          code: error ? "INTERNAL_ERROR" : "NOT_FOUND",
          message: error?.message ?? "클라이언트가 없습니다",
        },
      },
      { status: error ? 500 : 404 },
    );
  }

  return NextResponse.json({ data: { client } });
}
