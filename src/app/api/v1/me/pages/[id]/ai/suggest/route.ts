import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { suggestCopy } from "@/lib/ai/anthropic";
import { checkAndIncrement } from "@/lib/rate-limit";

interface Params {
  params: Promise<{ id: string }>;
}

interface PostBody {
  field?: "tagline" | "story";
  input?: string;
}

/**
 * POST /api/v1/me/pages/:id/ai/suggest — 사장님 AI 보강 1회 제안.
 *
 * 정책 (v2 §7):
 *   - field: "tagline" | "story" 만 허용 (FAQ·상품설명 X)
 *   - 1회 호출 = 3개 제안 반환. 사장님이 픽 또는 무시.
 *   - Rate limit: 페이지·필드 조합으로 5분 1회 (남발 차단)
 *   - Claude Haiku 사용 (비용 최소)
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §5.1 + §7
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const field = body.field;
  if (field !== "tagline" && field !== "story") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: 'field 는 "tagline" 또는 "story" 만 가능합니다',
        },
      },
      { status: 400 },
    );
  }

  const userInput = (body.input ?? "").trim();
  if (userInput.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "input 텍스트가 필요합니다 (빈 상태에서는 제안 X)",
        },
      },
      { status: 400 },
    );
  }

  // Rate limit — 페이지·필드별 5분 1회
  const rateKey = `ai_suggest:${pageId}:${field}`;
  const limit = await checkAndIncrement(rateKey, 300, 1);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message:
            "AI 추천은 잠시 후 다시 받을 수 있습니다 (5분 1회).",
          retryAfterSeconds: limit.retryAfterSeconds,
        },
      },
      { status: 429 },
    );
  }

  const supabase = createServerSupabase();
  const [{ data: page }, { data: client }] = await Promise.all([
    supabase
      .from("pages")
      .select("template_type, tone_key")
      .eq("id", pageId)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("business_name, business_type")
      .eq("id", auth.sub)
      .maybeSingle(),
  ]);

  try {
    const result = await suggestCopy({
      field,
      input: userInput,
      businessName: client?.business_name ?? "",
      businessType: client?.business_type ?? page?.template_type ?? "",
      toneKey: page?.tone_key ?? null,
    });
    return NextResponse.json({
      data: {
        suggestions: result.suggestions,
        tokensUsed: result.tokensUsed,
        costKrw: result.costKrw,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "AI 제안 실패: " +
            (err instanceof Error ? err.message : String(err)),
        },
      },
      { status: 500 },
    );
  }
}
