import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/clients/:id — 클라이언트 상세 + 본인 페이지 리스트.
 * reference: docs/focusme-api-spec.md §4.21
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: client, error } = await supabase
    .from("clients")
    .select(
      "id, phone, kakao_id, email, business_name, business_type, signup_date, status, payment_status, invoice_number, invoiced_at, paid_at, payment_amount, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "클라이언트가 없습니다" } },
      { status: 404 },
    );
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, status, template_type, published_at, updated_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    data: { client, pages: pages ?? [] },
  });
}
