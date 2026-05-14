import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * 크롤러 정책:
 *   - /                — 랜딩 허용
 *   - /p/*             — 공개 페이지 허용
 *   - /login           — 로그인 폼은 색인 노출 차단 (sitemap 에는 포함, 검색 결과는 차단)
 *   - /admin/*, /me/*  — 비공개. 절대 색인 금지.
 *   - /api/*           — 색인 의미 없음.
 *
 * Next 16 file convention: app/robots.ts
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/"],
        disallow: ["/admin/", "/me/", "/api/", "/login"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
