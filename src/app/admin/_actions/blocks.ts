"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export interface BlockMutationResult {
  error?: string;
  blockId?: string;
}

function safeParse(json: string): Record<string, unknown> | string {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return "JSON 객체가 아닙니다";
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    return `JSON 파싱 오류: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function addBlockAction(
  pageId: string,
  blockType: string,
  configJson: string,
  contentJson: string,
): Promise<BlockMutationResult> {
  const config = safeParse(configJson);
  if (typeof config === "string") return { error: `config: ${config}` };
  const content = safeParse(contentJson);
  if (typeof content === "string") return { error: `content: ${content}` };

  const supabase = createServerSupabase();

  // sort_order = max + 1
  const { data: maxRow } = await supabase
    .from("blocks")
    .select("sort_order")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("blocks")
    .insert({
      page_id: pageId,
      block_type: blockType,
      sort_order: nextOrder,
      is_enabled: true,
      is_system: false,
      config,
      content,
    })
    .select()
    .single();
  if (error || !data) return { error: error?.message ?? "블록 생성 실패" };

  revalidatePath(`/admin/pages/${pageId}/edit`);
  return { blockId: data.id };
}

export async function updateBlockAction(
  pageId: string,
  blockId: string,
  configJson: string,
  contentJson: string,
  isEnabled: boolean,
): Promise<BlockMutationResult> {
  const config = safeParse(configJson);
  if (typeof config === "string") return { error: `config: ${config}` };
  const content = safeParse(contentJson);
  if (typeof content === "string") return { error: `content: ${content}` };

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("blocks")
    .update({ config, content, is_enabled: isEnabled })
    .eq("id", blockId)
    .eq("page_id", pageId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/pages/${pageId}/edit`);
  return { blockId };
}

export async function deleteBlockAction(
  pageId: string,
  blockId: string,
): Promise<BlockMutationResult> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", blockId)
    .eq("page_id", pageId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/pages/${pageId}/edit`);
  return {};
}

export async function moveBlockAction(
  pageId: string,
  blockId: string,
  direction: "up" | "down",
): Promise<BlockMutationResult> {
  const supabase = createServerSupabase();
  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, sort_order")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });
  if (!blocks) return { error: "블록 로드 실패" };

  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return { error: "블록을 찾을 수 없습니다" };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return {};

  const a = blocks[idx];
  const b = blocks[swapIdx];

  await supabase.from("blocks").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("blocks").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath(`/admin/pages/${pageId}/edit`);
  return {};
}
