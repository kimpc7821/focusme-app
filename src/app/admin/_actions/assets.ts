"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteFromR2, keyFromPublicUrl } from "@/lib/storage/r2";

export async function deleteAssetAction(
  pageId: string,
  assetId: string,
): Promise<{ error?: string }> {
  const supabase = createServerSupabase();
  const { data: asset } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("page_id", pageId)
    .maybeSingle();
  if (!asset) return { error: "자료가 없습니다" };

  const key = keyFromPublicUrl(asset.url);
  if (key) {
    try {
      await deleteFromR2(key);
    } catch {
      // orphan file은 추후 cleanup
    }
  }

  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/pages/${pageId}/edit`);
  return {};
}
