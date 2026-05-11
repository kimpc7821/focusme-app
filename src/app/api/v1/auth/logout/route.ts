import { NextResponse } from "next/server";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { revokeRefreshToken } from "@/lib/auth/refresh-tokens";

interface Body {
  refreshToken?: string;
}

/**
 * POST /api/v1/auth/logout
 * Authorization 헤더의 access token 대신 body로 refresh token을 받아 revoke.
 * (access token 자체는 만료 시 자동 무효화)
 * reference: docs/focusme-api-spec.md §1.5
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  if (body.refreshToken) {
    const payload = await verifyRefreshToken(body.refreshToken);
    if (payload) await revokeRefreshToken(payload.jti);
  }

  return NextResponse.json({ data: { success: true } });
}
