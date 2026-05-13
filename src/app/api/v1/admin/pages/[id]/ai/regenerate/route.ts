import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { regenerateBlockContent } from "@/lib/ai/anthropic";

interface Params {
  params: Promise<{ id: string }>;
}

interface Body {
  targetBlockIds?: string[];
  instruction?: string;
  keepFacts?: boolean;
}

/**
 * POST /api/v1/admin/pages/:id/ai/regenerate
 * Claude Sonnet 호출. 결과 즉시 DB 반영 X — before/after 둘 다 반환.
 * 직원이 ai/apply 로 채택해야 실제 update.
 * reference: docs/focusme-api-spec.md §4.9
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.targetBlockIds) || body.targetBlockIds.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "targetBlockIds 배열이 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, tone_key, template_type, client_id")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, business_type")
    .eq("id", page.client_id)
    .maybeSingle();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .in("id", body.targetBlockIds)
    .eq("page_id", pageId);
  if (!blocks || blocks.length === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "블록이 없습니다" } },
      { status: 404 },
    );
  }

  const keepFacts = body.keepFacts ?? true;
  const results: unknown[] = [];
  let totalIn = 0;
  let totalOut = 0;
  let totalCost = 0;

  try {
    for (const b of blocks) {
      const r = await regenerateBlockContent({
        blockId: b.id,
        blockType: b.block_type,
        currentConfig: b.config as Record<string, unknown>,
        currentContent: b.content as Record<string, unknown>,
        instruction: body.instruction,
        keepFacts,
        businessName: client?.business_name ?? "",
        businessType: client?.business_type ?? page.template_type,
        toneKey: page.tone_key,
      });
      totalIn += r.tokensUsed.input;
      totalOut += r.tokensUsed.output;
      totalCost += r.costKrw;
      results.push(r);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "AI_ERROR",
          message: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    data: {
      results,
      tokensUsed: { input: totalIn, output: totalOut },
      costKrw: Math.round(totalCost * 10) / 10,
    },
  });
}
