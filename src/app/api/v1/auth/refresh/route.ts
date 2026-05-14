import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  TOKEN_EXPIRES,
} from "@/lib/auth/jwt";
import {
  isRefreshTokenActive,
  persistRefreshToken,
  revokeRefreshToken,
} from "@/lib/auth/refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  CLIENT_ACCESS_COOKIE,
  CLIENT_REFRESH_COOKIE,
  buildCookieOptions,
} from "@/lib/auth/cookies";

interface Body {
  refreshToken?: string;
}

/**
 * POST /api/v1/auth/refresh — refresh token rotation (admin · client 공통).
 * body refreshToken 또는 쿠키 둘 다 인식. 이전 jti revoke + 새 jti 발급.
 * reference: docs/focusme-api-spec.md §1.4
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
    body.refreshToken ??
    cookieStore.get(REFRESH_COOKIE)?.value ??
    cookieStore.get(CLIENT_REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "refresh token이 없습니다" } },
      { status: 401 },
    );
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다" } },
      { status: 401 },
    );
  }

  const active = await isRefreshTokenActive(payload.jti);
  if (!active) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "만료되거나 무효화된 토큰입니다",
        },
      },
      { status: 401 },
    );
  }

  const supabase = createServerSupabase();

  if (payload.role === "admin") {
    const { data: admin } = await supabase
      .from("admins")
      .select("id, email, name, active")
      .eq("id", payload.sub)
      .maybeSingle();
    if (!admin || !admin.active) {
      await revokeRefreshToken(payload.jti);
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "계정이 비활성 상태입니다" },
        },
        { status: 401 },
      );
    }

    await revokeRefreshToken(payload.jti);
    const accessToken = await signAccessToken({
      sub: admin.id,
      role: "admin",
      email: admin.email,
      name: admin.name,
    });
    const next = await signRefreshToken(admin.id, "admin");
    await persistRefreshToken({
      jti: next.jti,
      actorType: "admin",
      actorId: admin.id,
      expiresAt: next.expiresAt,
    });

    const response = NextResponse.json({
      data: { accessToken, refreshToken: next.token },
    });
    response.cookies.set(
      ACCESS_COOKIE,
      accessToken,
      buildCookieOptions(TOKEN_EXPIRES.access),
    );
    response.cookies.set(
      REFRESH_COOKIE,
      next.token,
      buildCookieOptions(TOKEN_EXPIRES.refresh),
    );
    return response;
  }

  if (payload.role === "client") {
    const { data: client } = await supabase
      .from("clients")
      .select("id, business_name, status")
      .eq("id", payload.sub)
      .maybeSingle();
    if (!client || client.status !== "active") {
      await revokeRefreshToken(payload.jti);
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "계정이 비활성 상태입니다" },
        },
        { status: 401 },
      );
    }

    await revokeRefreshToken(payload.jti);
    const accessToken = await signAccessToken({
      sub: client.id,
      role: "client",
      name: client.business_name ?? undefined,
    });
    const next = await signRefreshToken(client.id, "client");
    await persistRefreshToken({
      jti: next.jti,
      actorType: "client",
      actorId: client.id,
      expiresAt: next.expiresAt,
    });

    const response = NextResponse.json({
      data: { accessToken, refreshToken: next.token },
    });
    response.cookies.set(
      CLIENT_ACCESS_COOKIE,
      accessToken,
      buildCookieOptions(TOKEN_EXPIRES.access),
    );
    response.cookies.set(
      CLIENT_REFRESH_COOKIE,
      next.token,
      buildCookieOptions(TOKEN_EXPIRES.refresh),
    );
    return response;
  }

  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "지원하지 않는 토큰입니다" } },
    { status: 401 },
  );
}
