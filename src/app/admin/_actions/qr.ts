"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { uploadToR2, deleteFromR2, keyFromPublicUrl } from "@/lib/storage/r2";
import {
  buildTargetUrl,
  generateQrPng,
  generateQrSvg,
} from "@/lib/qr/generate";

export async function createQrAction(
  formData: FormData,
): Promise<void> {
  const pageId = String(formData.get("pageId") ?? "");
  const channelName = String(formData.get("channelName") ?? "").trim();
  const utmSource = String(formData.get("utmSource") ?? "").trim() || null;
  const utmMedium = String(formData.get("utmMedium") ?? "qr").trim() || "qr";
  const utmCampaign = String(formData.get("utmCampaign") ?? "").trim() || null;

  if (!pageId || !channelName) return;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const targetUrl = buildTargetUrl({
    baseUrl,
    slug: page.slug,
    utmSource: utmSource ?? undefined,
    utmMedium,
    utmCampaign: utmCampaign ?? undefined,
  });

  const uuid = randomUUID();
  const png = await generateQrPng(targetUrl);
  const pngResult = await uploadToR2({
    key: `qr/${pageId}/${uuid}.png`,
    body: new Uint8Array(png),
    contentType: "image/png",
  });
  const svg = await generateQrSvg(targetUrl);
  const svgResult = await uploadToR2({
    key: `qr/${pageId}/${uuid}.svg`,
    body: new TextEncoder().encode(svg),
    contentType: "image/svg+xml",
  });

  await supabase.from("qr_codes").insert({
    page_id: pageId,
    channel_name: channelName,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    target_url: targetUrl,
    image_url: pngResult.publicUrl,
    svg_url: svgResult.publicUrl,
  });

  revalidatePath(`/admin/pages/${pageId}/qr`);
}

export async function deleteQrAction(
  formData: FormData,
): Promise<void> {
  const pageId = String(formData.get("pageId") ?? "");
  const qrId = String(formData.get("qrId") ?? "");
  if (!pageId || !qrId) return;

  const supabase = createServerSupabase();
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", qrId)
    .eq("page_id", pageId)
    .maybeSingle();
  if (!qr) return;

  for (const url of [qr.image_url, qr.svg_url]) {
    if (!url) continue;
    const key = keyFromPublicUrl(url);
    if (key) {
      try {
        await deleteFromR2(key);
      } catch {
        // 무시
      }
    }
  }

  await supabase.from("qr_codes").delete().eq("id", qrId);
  revalidatePath(`/admin/pages/${pageId}/qr`);
}
