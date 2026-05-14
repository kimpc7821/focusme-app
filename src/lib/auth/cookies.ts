export const ACCESS_COOKIE = "focusme_admin_access";
export const REFRESH_COOKIE = "focusme_admin_refresh";

export const CLIENT_ACCESS_COOKIE = "focusme_client_access";
export const CLIENT_REFRESH_COOKIE = "focusme_client_refresh";

export function buildCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function buildClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
