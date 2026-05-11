import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/v1/lookup/block-types
 * 16개 블록 메타 (revision 1: business_info → location_info + legal_footer).
 * reference: docs/focusme-api-spec.md §5.2
 */
export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("lookup_block_types")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { data: data ?? [] },
    {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
