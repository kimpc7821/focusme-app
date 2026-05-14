import type { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * 발행된 모든 /p/[slug] 페이지 + 정적 진입점.
 * /admin/* · /me/* · /api/* 는 robots 에서 disallow — sitemap 에도 포함 X.
 *
 * Next 16 file convention: app/sitemap.ts
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let pageEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServerSupabase();
    const { data: pages } = await supabase
      .from("pages")
      .select("slug, published_at, updated_at")
      .eq("status", "published");
    pageEntries = (pages ?? []).map((p) => ({
      url: `${BASE_URL}/p/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // env / DB 미설정 환경에서도 빌드는 깨지지 않도록 — 정적 entry 만 반환.
  }

  return [...staticEntries, ...pageEntries];
}
