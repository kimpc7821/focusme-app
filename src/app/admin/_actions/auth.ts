"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { revokeRefreshToken } from "@/lib/auth/refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildClearCookieOptions,
} from "@/lib/auth/cookies";

export async function logoutAction() {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const payload = await verifyRefreshToken(refresh);
    if (payload) await revokeRefreshToken(payload.jti);
  }
  store.set(ACCESS_COOKIE, "", buildClearCookieOptions());
  store.set(REFRESH_COOKIE, "", buildClearCookieOptions());
  redirect("/admin/login");
}
