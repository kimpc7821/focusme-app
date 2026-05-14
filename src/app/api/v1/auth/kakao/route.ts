import { NextResponse } from "next/server";
import { verifyKakaoAccessToken } from "@/lib/auth/kakao";
import {
  createClientFromKakao,
  findClientByKakaoId,
  findClientByPhone,
  linkKakaoToClient,
  type ClientRow,
} from "@/lib/db/clients";
import {
  signAccessToken,
  signRefreshToken,
  TOKEN_EXPIRES,
} from "@/lib/auth/jwt";
import { persistRefreshToken } from "@/lib/auth/refresh-tokens";
import {
  CLIENT_ACCESS_COOKIE,
  CLIENT_REFRESH_COOKIE,
  buildCookieOptions,
} from "@/lib/auth/cookies";
import { normalizePhone } from "@/lib/auth/sms";

interface Body {
  kakaoAccessToken?: string;
}

/**
 * POST /api/v1/auth/kakao — 카카오 access token 으로 로그인/가입.
 * reference: docs/focusme-api-spec.md §1.1
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

  if (!body.kakaoAccessToken) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "kakaoAccessToken 이 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const profile = await verifyKakaoAccessToken(body.kakaoAccessToken);
  if (!profile) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "유효하지 않은 카카오 토큰입니다",
        },
      },
      { status: 401 },
    );
  }

  // 1) kakao_id 로 기존 클라이언트 조회
  let client: ClientRow | null = await findClientByKakaoId(profile.kakaoId);
  let isNewUser = false;

  // 2) 없으면 카카오가 phone 을 주는 경우 phone 매칭으로 기존 클라이언트 연결
  if (!client && profile.phone) {
    const normalized = normalizePhone(profile.phone);
    const byPhone = await findClientByPhone(normalized);
    if (byPhone && !byPhone.kakao_id) {
      await linkKakaoToClient(byPhone.id, profile.kakaoId);
      client = { ...byPhone, kakao_id: profile.kakaoId };
    }
  }

  // 3) 그래도 없으면 신규 생성
  if (!client) {
    client = await createClientFromKakao({
      kakaoId: profile.kakaoId,
      email: profile.email,
      phone: profile.phone ? normalizePhone(profile.phone) : undefined,
      nickname: profile.nickname,
    });
    isNewUser = true;
  }

  if (client.status !== "active") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "비활성 상태의 계정입니다" } },
      { status: 403 },
    );
  }

  const accessToken = await signAccessToken({
    sub: client.id,
    role: "client",
    name: client.business_name ?? undefined,
  });
  const refresh = await signRefreshToken(client.id, "client");
  await persistRefreshToken({
    jti: refresh.jti,
    actorType: "client",
    actorId: client.id,
    expiresAt: refresh.expiresAt,
  });

  const response = NextResponse.json({
    data: {
      accessToken,
      refreshToken: refresh.token,
      user: {
        id: client.id,
        phone: client.phone,
        businessName: client.business_name,
        role: "client",
      },
      isNewUser,
    },
  });
  response.cookies.set(
    CLIENT_ACCESS_COOKIE,
    accessToken,
    buildCookieOptions(TOKEN_EXPIRES.access),
  );
  response.cookies.set(
    CLIENT_REFRESH_COOKIE,
    refresh.token,
    buildCookieOptions(TOKEN_EXPIRES.refresh),
  );
  return response;
}
