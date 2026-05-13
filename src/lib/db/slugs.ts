const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "logout",
  "signup",
  "me",
  "app",
  "www",
  "static",
  "cdn",
  "p",
  "preview",
  "public",
  "assets",
  "webhook",
  "lookup",
  "about",
  "pricing",
  "help",
  "support",
  "contact",
  "terms",
  "privacy",
  "faq",
  "blog",
  "news",
  "cafe",
  "clinic",
  "shop",
  "store",
  "home",
  "office",
  "studio",
  "school",
  "test",
  "demo",
  "focusme",
  "vdirectors",
]);

export function validateSlug(slug: string): {
  ok: boolean;
  reason?: string;
} {
  if (!slug) return { ok: false, reason: "슬러그가 비어있습니다" };
  if (!/^[a-z0-9-]{3,30}$/.test(slug))
    return { ok: false, reason: "소문자·숫자·하이픈 3~30자만 가능합니다" };
  if (slug.startsWith("-") || slug.endsWith("-"))
    return { ok: false, reason: "하이픈으로 시작·끝낼 수 없습니다" };
  if (RESERVED_SLUGS.has(slug))
    return { ok: false, reason: "예약된 슬러그입니다" };
  return { ok: true };
}
