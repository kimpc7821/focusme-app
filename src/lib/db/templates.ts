import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { EMPTY_SCHEMAS } from "@/lib/blocks/empty-schemas";

/**
 * 페이지 생성 시 업종 템플릿의 default_blocks 를 자동으로 blocks 테이블에 INSERT.
 *
 * 흐름:
 *   1. lookup_templates 에서 templateType 의 default_blocks 가져옴 ([{blockType, sortOrder}, ...])
 *   2. 각 blockType 에 대해 lookup_block_types 에서 default_config·is_system 가져옴
 *   3. blocks 에 bulk INSERT — is_enabled=true, content={} (자료는 직원이 채움)
 *
 * 운영 흐름 §5 — 직원이 페이지 생성 → 시스템이 자동으로 골격 만들어줌 → 직원은 자료만 채움.
 * 사장님 자율 편집 범위는 spec §5.4 레벨 1 — 이미 있는 블록의 ON/OFF·순서·텍스트 수정.
 */

interface TemplateBlockEntry {
  blockType: string;
  sortOrder: number;
}

interface BlockTypeRow {
  key: string;
  is_system: boolean;
  default_config: Record<string, unknown> | null;
}

export async function createDefaultBlocksForPage(
  supabase: SupabaseClient<Database>,
  pageId: string,
  templateType: string,
): Promise<{ inserted: number }> {
  const { data: template, error: tErr } = await supabase
    .from("lookup_templates")
    .select("default_blocks")
    .eq("key", templateType)
    .maybeSingle();

  if (tErr || !template) {
    console.warn(
      `[templates] lookup_templates(${templateType}) 없음 — 빈 페이지로 시작`,
    );
    return { inserted: 0 };
  }

  const entries = (template.default_blocks ?? []) as TemplateBlockEntry[];
  if (!Array.isArray(entries) || entries.length === 0) {
    return { inserted: 0 };
  }

  const blockTypeKeys = Array.from(new Set(entries.map((e) => e.blockType)));
  const { data: blockTypes, error: btErr } = await supabase
    .from("lookup_block_types")
    .select("key, is_system, default_config")
    .in("key", blockTypeKeys);

  if (btErr) {
    console.warn(`[templates] lookup_block_types 조회 실패: ${btErr.message}`);
    return { inserted: 0 };
  }

  const byKey = new Map<string, BlockTypeRow>();
  for (const row of blockTypes ?? []) byKey.set(row.key, row as BlockTypeRow);

  const inserts = entries.map((e) => {
    const meta = byKey.get(e.blockType);
    return {
      page_id: pageId,
      block_type: e.blockType,
      sort_order: e.sortOrder,
      is_enabled: true,
      is_system: meta?.is_system ?? false,
      config: (meta?.default_config as Record<string, unknown> | null) ?? {},
      content: EMPTY_SCHEMAS[e.blockType]?.initialContent ?? {},
    };
  });

  const { error: insErr } = await supabase.from("blocks").insert(inserts);
  if (insErr) {
    console.warn(`[templates] blocks INSERT 실패: ${insErr.message}`);
    return { inserted: 0 };
  }
  return { inserted: inserts.length };
}
