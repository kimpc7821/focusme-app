import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EssentialInfo } from "@/lib/types";
import { deepMerge } from "@/lib/services/auto-reflect";
import { normalizeBusinessPhone } from "@/lib/auth/sms";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/me/pages/:id/essential-info — Step 1 폼 저장.
 *
 * 부분 patch (deep merge) — 사장님이 일부 필드만 수정해도 OK.
 * essential_info 는 v2 source of truth — 모든 시스템·숨김 블록이 자동 참조.
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.2 + §5.1
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: Partial<EssentialInfo>;
  try {
    body = (await request.json()) as Partial<EssentialInfo>;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "빈 요청" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("essential_info")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }

  // 전화번호 정규화 — 매장 대표 전화 (010 외 02·031·042 등 가변 포맷 지원)
  const normalizedBody: Partial<EssentialInfo> = { ...body };
  if (typeof normalizedBody.phone === "string" && normalizedBody.phone.trim()) {
    normalizedBody.phone = normalizeBusinessPhone(normalizedBody.phone);
  }

  const existing = (page.essential_info ?? {}) as Record<string, unknown>;
  const merged = deepMerge(existing, normalizedBody as Record<string, unknown>);

  const { error: updErr } = await supabase
    .from("pages")
    .update({ essential_info: merged })
    .eq("id", pageId);

  if (updErr) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: updErr.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: { success: true, essentialInfo: merged },
  });
}
