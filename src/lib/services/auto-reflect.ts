/**
 * /me/pages/:id PATCH 자동 반영 분류·적용 로직.
 * reference: docs/focusme-api-spec.md §3.4 + §11.1
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface BlockUpdate {
  id: string;
  content?: Record<string, unknown>;
  config?: Record<string, unknown>;
  // v2: 비시스템 블록 ON/OFF 자동 반영 허용 (Step 0 토글 + 발행 후 /edit). 시스템 블록은 PATCH 라우트에서 별도 거부.
  isEnabled?: boolean;
  // 거부 대상 필드 — 들어오면 INVALID_CHANGE.
  blockType?: unknown;
  block_type?: unknown;
  is_enabled?: unknown;
  sortOrder?: unknown;
  sort_order?: unknown;
  isSystem?: unknown;
  is_system?: unknown;
}

const REJECTED_BLOCK_FIELDS = [
  "blockType",
  "block_type",
  "is_enabled",
  "sortOrder",
  "sort_order",
  "isSystem",
  "is_system",
];

const ALLOWED_CONFIG_KEYS = new Set(["layout", "options"]);

export interface ClassifyResult {
  ok: boolean;
  rejected: string[]; // 거부된 필드 path (예: "blockType", "config.colors")
}

/**
 * 자동 반영 가능 여부 분류 — DB 접근 X. 순수 함수.
 */
export function classifyUpdates(updates: BlockUpdate[]): ClassifyResult {
  const rejected: string[] = [];

  for (const upd of updates) {
    if (!upd.id) {
      rejected.push("id (missing)");
      continue;
    }
    for (const key of Object.keys(upd)) {
      if (key === "id" || key === "content") continue;

      // v2: isEnabled 는 boolean 일 때만 허용 (시스템 블록 가드는 PATCH 라우트에서)
      if (key === "isEnabled") {
        if (typeof upd.isEnabled !== "boolean") {
          rejected.push("isEnabled (not boolean)");
        }
        continue;
      }

      if (REJECTED_BLOCK_FIELDS.includes(key)) {
        rejected.push(key);
        continue;
      }

      if (key === "config") {
        const cfg = upd.config ?? {};
        for (const cKey of Object.keys(cfg)) {
          if (!ALLOWED_CONFIG_KEYS.has(cKey)) {
            rejected.push(`config.${cKey}`);
          }
        }
        continue;
      }

      // 알 수 없는 필드도 거부
      rejected.push(key);
    }
  }

  return { ok: rejected.length === 0, rejected };
}

/**
 * 두 JSON 객체 deep merge — partial update 용.
 * 배열은 통째로 replace (사장님이 항목을 명시적으로 보낸다고 가정).
 */
export function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    const existing = out[k];
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      existing !== null &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      out[k] = deepMerge(
        existing as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * 분류 통과한 updates 를 DB 에 적용.
 * 각 블록을 read-then-write 로 patch — content/config JSONB 를 deep merge.
 * 변경된 경로 리스트 반환 (예: ["blocks.uuid.content.tagline"]).
 */
export async function applyAutoUpdates(
  supabase: SupabaseClient<Database>,
  pageId: string,
  updates: BlockUpdate[],
): Promise<{ appliedPaths: string[]; appliedAt: string }> {
  const appliedPaths: string[] = [];

  for (const upd of updates) {
    const { data: existing } = await supabase
      .from("blocks")
      .select("id, content, config, is_system")
      .eq("id", upd.id)
      .eq("page_id", pageId)
      .maybeSingle();
    if (!existing) continue;

    const patch: {
      content?: Record<string, unknown>;
      config?: Record<string, unknown>;
      is_enabled?: boolean;
    } = {};
    if (upd.content) {
      patch.content = deepMerge(
        (existing.content as Record<string, unknown>) ?? {},
        upd.content,
      );
      for (const k of Object.keys(upd.content)) {
        appliedPaths.push(`blocks.${upd.id}.content.${k}`);
      }
    }
    if (upd.config) {
      patch.config = deepMerge(
        (existing.config as Record<string, unknown>) ?? {},
        upd.config,
      );
      for (const k of Object.keys(upd.config)) {
        appliedPaths.push(`blocks.${upd.id}.config.${k}`);
      }
    }
    // v2: 비시스템 블록만 isEnabled 변경 적용 (시스템 블록은 silently skip)
    if (typeof upd.isEnabled === "boolean" && !existing.is_system) {
      patch.is_enabled = upd.isEnabled;
      appliedPaths.push(`blocks.${upd.id}.isEnabled`);
    }
    if (Object.keys(patch).length === 0) continue;

    await supabase
      .from("blocks")
      .update(patch)
      .eq("id", upd.id)
      .eq("page_id", pageId);
  }

  // 페이지 updated_at 갱신 — 사장님이 자료를 만진 시점 기록.
  const appliedAt = new Date().toISOString();
  await supabase
    .from("pages")
    .update({ updated_at: appliedAt })
    .eq("id", pageId);

  return { appliedPaths, appliedAt };
}
