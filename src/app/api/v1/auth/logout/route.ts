import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { revokeRefreshToken } from "@/lib/auth/refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildClearCookieOptions,
} from "@/lib/auth/cookies";

interface Body {
  refreshToken?: string;
}

/**
 * POST /api/v1/auth/logout
 * - body refreshToken 또는 쿠키 둘 다 인식.
 * - jti revoke + 쿠키 제거. 실패해도 200 반환.
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
  const refreshToken =
    body.refreshToken ?? cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) await revokeRefreshToken(payload.jti);
  }

  const response = NextResponse.json({ data: { success: true } });
  response.cookies.set(ACCESS_COOKIE, "", buildClearCookieOptions());
  response.cookies.set(REFRESH_COOKIE, "", buildClearCookieOptions());
  return response;
}
