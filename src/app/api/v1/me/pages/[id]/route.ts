import { NextResponse } from "next/server";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  applyAutoUpdates,
  classifyUpdates,
  type BlockUpdate,
} from "@/lib/services/auto-reflect";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/me/pages/:id — 페이지 + blocks + assets.
 * 소유권 검사 필수.
 * reference: docs/focusme-api-spec.md §3.3
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select(
      "id, slug, template_type, status, brand_color, tone_key, published_at, updated_at",
    )
    .eq("id", pageId)
    .maybeSingle();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("page_id", pageId)
    .order("uploaded_at", { ascending: false });

  return NextResponse.json({
    data: {
      page: page
        ? {
            id: page.id,
            slug: page.slug,
            templateType: page.template_type,
            status: page.status,
            brandColor: page.brand_color,
            toneKey: page.tone_key,
            publishedAt: page.published_at,
            updatedAt: page.updated_at,
          }
        : null,
      blocks: (blocks ?? []).map((b) => ({
        id: b.id,
        blockType: b.block_type,
        sortOrder: b.sort_order,
        isEnabled: b.is_enabled,
        isSystem: b.is_system,
        config: b.config,
        content: b.content,
      })),
      assets: (assets ?? []).map((a) => ({
        id: a.id,
        blockId: a.block_id,
        category: a.category,
        url: a.url,
        meta: a.meta,
        uploadedAt: a.uploaded_at,
      })),
    },
  });
}

interface PatchBody {
  blocks?: BlockUpdate[];
}

/**
 * PATCH /api/v1/me/pages/:id — 자료 수정 자동 반영.
 * content / config.layout / config.options 만 허용.
 * 다른 필드 (blockType, isEnabled, sortOrder 등) 시도 시 INVALID_CHANGE 400.
 * reference: docs/focusme-api-spec.md §3.4 + §11.1
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const updates = body.blocks ?? [];
  if (updates.length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "변경할 블록이 없습니다" } },
      { status: 400 },
    );
  }

  const verdict = classifyUpdates(updates);
  if (!verdict.ok) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CHANGE",
          message: "이 변경은 자동 반영이 불가합니다. 문의해주세요.",
          details: {
            allowedFields: ["content.*", "config.layout", "config.options"],
            rejectedFields: verdict.rejected,
          },
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { appliedPaths, appliedAt } = await applyAutoUpdates(
    supabase,
    pageId,
    updates,
  );

  return NextResponse.json({
    data: {
      success: true,
      appliedAt,
      changesApplied: appliedPaths,
    },
  });
}
