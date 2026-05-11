import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";
import {
  isRefreshTokenActive,
  persistRefreshToken,
  revokeRefreshToken,
} from "@/lib/auth/refresh-tokens";

interface Body {
  refreshToken?: string;
}

/**
 * POST /api/v1/auth/refresh — refresh token rotation.
 * 이전 jti revoke + 새 jti 발급.
 * reference: docs/focusme-api-spec.md §1.4
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body.refreshToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "refresh token이 없습니다" } },
      { status: 401 },
    );
  }

  const payload = await verifyRefreshToken(body.refreshToken);
  if (!payload) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다" } },
      { status: 401 },
    );
  }

  const active = await isRefreshTokenActive(payload.jti);
  if (!active) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "만료되거나 무효화된 토큰입니다" } },
      { status: 401 },
    );
  }

  // actor 정보 조회 (admin/client 분기는 추후 client 도입 시 확장)
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
        { error: { code: "UNAUTHORIZED", message: "계정이 비활성 상태입니다" } },
        { status: 401 },
      );
    }

    // 이전 토큰 revoke + 새 토큰 발급
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

    return NextResponse.json({
      data: { accessToken, refreshToken: next.token },
    });
  }

  // client refresh — 아직 미구현
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "지원하지 않는 토큰입니다" } },
    { status: 401 },
  );
}
