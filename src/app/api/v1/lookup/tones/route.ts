import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/v1/lookup/tones
 * 5개 톤 라이브러리.
 * reference: docs/focusme-api-spec.md §5.3
 */
export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("lookup_tone_presets")
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
