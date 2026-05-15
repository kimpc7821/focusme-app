import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkAndIncrement, getClientIp } from "@/lib/rate-limit";
import { normalizeBusinessPhone, isValidBusinessPhone } from "@/lib/auth/sms";

interface Body {
  businessName?: string;
  phone?: string;
  message?: string;
}

const INQUIRY_WINDOW_SECONDS = 600; // 10분
const INQUIRY_MAX = 5;

/**
 * POST /api/v1/inquiry — 초대 URL 없이 들어온 잠재고객 개설 문의.
 *
 * inquiries 테이블에 저장 → /admin/inquiries 에서 직원 확인.
 * Rate limit — 같은 IP 10분 5회 초과 시 스팸으로 보고 저장 skip (성공처럼 응답).
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

  const businessName = (body.businessName ?? "").trim();
  const phoneRaw = (body.phone ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!businessName || !phoneRaw || !message) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "상호명·전화번호·문의 내용을 모두 입력해주세요",
        },
      },
      { status: 400 },
    );
  }

  const phone = normalizeBusinessPhone(phoneRaw);
  if (!isValidBusinessPhone(phone)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "올바른 전화번호 형식이 아닙니다",
        },
      },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const limit = await checkAndIncrement(
    `inquiry:${ip}`,
    INQUIRY_WINDOW_SECONDS,
    INQUIRY_MAX,
  );
  if (!limit.ok) {
    // 스팸 의심 — 사용자에겐 성공처럼 응답, 저장 skip.
    return NextResponse.json({ data: { success: true } });
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from("inquiries").insert({
      business_name: businessName.slice(0, 120),
      phone,
      message: message.slice(0, 2000),
      status: "new",
    });
    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "저장 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { success: true } });
}
