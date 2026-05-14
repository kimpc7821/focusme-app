import { NextResponse } from "next/server";
import {
  isValidKoreanPhone,
  normalizePhone,
  verifySmsCode,
  type SmsVerifyResult,
} from "@/lib/auth/sms";
import {
  createClientFromPhone,
  findClientByPhone,
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

interface Body {
  requestId?: string;
  phone?: string;
  code?: string;
}

const VERIFY_ERRORS: Record<
  Exclude<SmsVerifyResult, { ok: true }>["reason"],
  { status: number; code: string; message: string }
> = {
  not_found: {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "인증 요청을 찾을 수 없습니다",
  },
  expired: {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "인증번호가 만료되었습니다. 다시 발송해 주세요",
  },
  too_many: {
    status: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "시도 횟수를 초과했습니다. 다시 발송해 주세요",
  },
  wrong: {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "인증번호가 일치하지 않습니다",
  },
};

/**
 * POST /api/v1/auth/sms/verify — 인증번호 확인 + 로그인/가입.
 * reference: docs/focusme-api-spec.md §1.3
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

  const requestId = body.requestId?.trim();
  const phoneRaw = body.phone?.trim();
  const code = body.code?.trim();
  if (!requestId || !phoneRaw || !code) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "requestId, phone, code 가 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const phone = normalizePhone(phoneRaw);
  if (!isValidKoreanPhone(phone)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "올바른 휴대폰 번호 형식이 아닙니다",
        },
      },
      { status: 400 },
    );
  }

  const result = await verifySmsCode({ requestId, phone, code });
  if (!result.ok) {
    const err = VERIFY_ERRORS[result.reason];
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }

  let client = await findClientByPhone(phone);
  let isNewUser = false;
  if (!client) {
    client = await createClientFromPhone({ phone });
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
