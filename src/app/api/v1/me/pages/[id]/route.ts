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
import {
  notifyAdminClientSelfEdit,
  notifyClientContentUpdated,
} from "@/lib/notifications";

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
            allowedFields: [
              "content.*",
              "config.layout",
              "config.options",
              "isEnabled (비시스템 블록만)",
            ],
            rejectedFields: verdict.rejected,
          },
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();

  // v2: isEnabled 변경 시도가 시스템 블록 대상이면 사전 거부
  // (auto-reflect 가 silently skip 하지만 사용자에게 명확한 피드백 주기 위함)
  const enableUpdates = updates.filter(
    (u) => typeof u.isEnabled === "boolean",
  );
  if (enableUpdates.length > 0) {
    const { data: targetBlocks } = await supabase
      .from("blocks")
      .select("id, is_system")
      .in(
        "id",
        enableUpdates.map((u) => u.id),
      )
      .eq("page_id", pageId);
    const systemViolations = (targetBlocks ?? [])
      .filter((b) => b.is_system)
      .map((b) => b.id);
    if (systemViolations.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CHANGE",
            message: "시스템 블록은 끌 수 없습니다.",
            details: { systemBlockIds: systemViolations },
          },
        },
        { status: 400 },
      );
    }
  }
  const { appliedPaths, appliedAt } = await applyAutoUpdates(
    supabase,
    pageId,
    updates,
  );

  // 알림: 양쪽에게 (사장님 확인 + 직원 사후 검토).
  // 발행 전 (submit 단계 토글·자료 수정) 은 알림 발사 X — 운영 중 자체 수정만 해당.
  // 변경된 필드 path 들을 한 줄 요약으로 (예: "메인 이미지·캡션 외 2건").
  // 실패해도 자동 반영 자체엔 영향 X.
  if (owns.status === "published") {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("phone, business_name")
        .eq("id", auth.sub)
        .maybeSingle();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const pageUrl = `${baseUrl}/p/${owns.slug}`;
      const editUrl = `${baseUrl}/me/pages/${pageId}/edit`;
      const changeType = summarizeChanges(appliedPaths);

      if (client) {
        await notifyClientContentUpdated({
          clientPhone: client.phone,
          businessName: client.business_name ?? owns.slug,
          changeType,
          pageUrl,
          editUrl,
        });
        await notifyAdminClientSelfEdit({
          businessName: client.business_name ?? owns.slug,
          changeType,
          pageUrl,
        });
      }
    } catch (err) {
      console.warn("[notify] me PATCH 알림 실패:", err);
    }
  }

  return NextResponse.json({
    data: {
      success: true,
      appliedAt,
      changesApplied: appliedPaths,
    },
  });
}

function summarizeChanges(paths: string[]): string {
  if (paths.length === 0) return "(빈 변경)";
  if (paths.length === 1) return shortLabel(paths[0]);
  const first = shortLabel(paths[0]);
  return `${first} 외 ${paths.length - 1}건`;
}

function shortLabel(path: string): string {
  // "blocks.<uuid>.content.tagline" → "tagline"
  const parts = path.split(".");
  return parts[parts.length - 1] ?? path;
}
