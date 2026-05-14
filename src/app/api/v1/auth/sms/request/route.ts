import { NextResponse } from "next/server";
import {
  generateAndSendSmsCode,
  isValidKoreanPhone,
  normalizePhone,
} from "@/lib/auth/sms";

interface Body {
  phone?: string;
}

/**
 * POST /api/v1/auth/sms/request — SMS 인증번호 발송.
 * reference: docs/focusme-api-spec.md §1.2
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

  const phoneRaw = body.phone?.trim();
  if (!phoneRaw) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "휴대폰 번호가 필요합니다" } },
      { status: 400 },
    );
  }

  const phone = normalizePhone(phoneRaw);
  if (!isValidKoreanPhone(phone)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "올바른 휴대폰 번호 형식이 아닙니다 (010-XXXX-XXXX)",
        },
      },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await generateAndSendSmsCode(phone);
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "인증번호 발송 실패: " +
            (err instanceof Error ? err.message : String(err)),
        },
      },
      { status: 500 },
    );
  }

  if (!result.ok && result.reason === "rate_limit") {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "발송 횟수가 너무 많습니다. 잠시 후 다시 시도하세요",
          details: { retryAfterSeconds: result.retryAfterSeconds },
        },
      },
      { status: 429 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "발송 실패" } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      requestId: result.requestId,
      expiresIn: result.expiresIn,
      // dev/mock 환경에서만 코드 노출 — 클라이언트가 자동입력 가능.
      ...(result.devCode ? { devCode: result.devCode } : {}),
    },
  });
}
