import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/reports/:id
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!report) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "리포트가 없습니다" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: report });
}
