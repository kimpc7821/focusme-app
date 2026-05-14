import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { revokeRefreshToken } from "@/lib/auth/refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  CLIENT_ACCESS_COOKIE,
  CLIENT_REFRESH_COOKIE,
  buildClearCookieOptions,
} from "@/lib/auth/cookies";

interface Body {
  refreshToken?: string;
}

/**
 * POST /api/v1/auth/logout
 * - admin / client 양쪽 refresh 쿠키 모두 인식.
 * - 발견된 모든 jti revoke + 네 쿠키 전부 clear.
 * reference: docs/focusme-api-spec.md §1.5
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const cookieStore = await cookies();
  const tokens = [
    body.refreshToken,
    cookieStore.get(REFRESH_COOKIE)?.value,
    cookieStore.get(CLIENT_REFRESH_COOKIE)?.value,
  ].filter((t): t is string => Boolean(t));

  for (const token of tokens) {
    const payload = await verifyRefreshToken(token);
    if (payload) await revokeRefreshToken(payload.jti);
  }

  const response = NextResponse.json({ data: { success: true } });
  response.cookies.set(ACCESS_COOKIE, "", buildClearCookieOptions());
  response.cookies.set(REFRESH_COOKIE, "", buildClearCookieOptions());
  response.cookies.set(CLIENT_ACCESS_COOKIE, "", buildClearCookieOptions());
  response.cookies.set(CLIENT_REFRESH_COOKIE, "", buildClearCookieOptions());
  return response;
}
