import bcrypt from "bcryptjs";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * SMS 인증번호 발송 / 검증.
 *
 * SMS_PROVIDER 환경변수:
 *   - "mock"  : console.log 로 코드 출력. dev 응답에 devCode 포함.
 *   - "toast" : NHN Toast SMS API 호출 (출시 1주 전 발신 프로필 등록 필요, MVP 전 미구현).
 *
 * reference: docs/focusme-api-spec.md §1.2 / §1.3
 */

const CODE_EXPIRES_SECONDS = 180; // 3분
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1시간
const RATE_LIMIT_MAX = 5; // 1h 5회
const MAX_ATTEMPTS = 5; // verify 5회 실패 시 코드 무효화
const BCRYPT_ROUNDS = 10;
const PROVIDER = process.env.SMS_PROVIDER ?? "mock";

export type SmsRequestResult =
  | { ok: true; requestId: string; expiresIn: number; devCode?: string }
  | { ok: false; reason: "rate_limit"; retryAfterSeconds: number };

export type SmsVerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many" | "wrong" };

export function normalizePhone(input: string): string {
  // 숫자만 추출 → 010-XXXX-XXXX 표준 포맷.
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith("01")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function isValidKoreanPhone(phone: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(phone);
}

/**
 * 매장 대표 전화번호 정규화 — 휴대폰·서울 유선·지역 유선 모두 지원.
 * 사용처: essential_info.phone (인증용 clients.phone 과 분리).
 *
 * 지원 포맷:
 *   - 02-XXX-XXXX  (서울, 9자리)
 *   - 02-XXXX-XXXX (서울, 10자리)
 *   - 0XX-XXX-XXXX  (지역·휴대폰, 10자리)
 *   - 0XX-XXXX-XXXX (지역·휴대폰, 11자리)
 *
 * 알 수 없는 길이/패턴은 원본 숫자만 리턴 (저장 가능).
 */
export function normalizeBusinessPhone(input: string): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("02")) {
    const rest = digits.slice(2);
    if (rest.length === 7) {
      return `02-${rest.slice(0, 3)}-${rest.slice(3)}`;
    }
    if (rest.length === 8) {
      return `02-${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
    return digits;
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    const area = digits.slice(0, 3);
    const rest = digits.slice(3);
    if (rest.length === 7) {
      return `${area}-${rest.slice(0, 3)}-${rest.slice(3)}`;
    }
    if (rest.length === 8) {
      return `${area}-${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
    return digits;
  }
  return digits;
}

export function isValidBusinessPhone(phone: string): boolean {
  return /^(02-\d{3,4}-\d{4}|0\d{2}-\d{3,4}-\d{4})$/.test(phone);
}

function generateCode(): string {
  // 6 자리, 첫 자리 0 가능. 보안상 crypto random 권장.
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

async function sendViaMock(phone: string, code: string): Promise<void> {
  console.log(`[sms:mock] ${phone} → 인증번호: ${code} (3분 유효)`);
}

async function sendViaToast(_phone: string, _code: string): Promise<void> {
  // TODO: NHN Toast SMS API 호출.
  // 발신 프로필 등록 완료 후 구현. 출시 1주일 전.
  throw new Error("SMS_PROVIDER=toast 는 아직 구현되지 않았습니다");
}

async function dispatch(phone: string, code: string): Promise<void> {
  if (PROVIDER === "mock") return sendViaMock(phone, code);
  if (PROVIDER === "toast") return sendViaToast(phone, code);
  throw new Error(`알 수 없는 SMS_PROVIDER: ${PROVIDER}`);
}

export async function generateAndSendSmsCode(
  phoneRaw: string,
): Promise<SmsRequestResult> {
  const phone = normalizePhone(phoneRaw);
  if (!isValidKoreanPhone(phone)) {
    // 형식 오류는 verify 처럼 일반 오류로 핸들링하지 않고
    // 호출 측이 validation 단계에서 잡도록 throw.
    throw new Error("올바른 휴대폰 형식이 아닙니다");
  }

  const supabase = createServerSupabase();

  // rate limit — 지난 1시간 발송 수
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from("sms_verifications")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);

  if (countError) {
    throw new Error(`SMS rate limit 확인 실패: ${countError.message}`);
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      reason: "rate_limit",
      retryAfterSeconds: RATE_LIMIT_WINDOW_MS / 1000,
    };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + CODE_EXPIRES_SECONDS * 1000);

  const { data, error } = await supabase
    .from("sms_verifications")
    .insert({
      phone,
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`SMS 인증번호 기록 실패: ${error?.message ?? "unknown"}`);
  }

  await dispatch(phone, code);

  const result: SmsRequestResult = {
    ok: true,
    requestId: data.id,
    expiresIn: CODE_EXPIRES_SECONDS,
  };
  // dev 단계에서 클라이언트 측 자동입력·테스트 편의 위해 mock 모드만 코드 노출.
  if (PROVIDER === "mock" && process.env.NODE_ENV !== "production") {
    result.devCode = code;
  }
  return result;
}

export async function verifySmsCode(args: {
  requestId: string;
  phone: string;
  code: string;
}): Promise<SmsVerifyResult> {
  const phone = normalizePhone(args.phone);
  const supabase = createServerSupabase();

  const { data: record, error } = await supabase
    .from("sms_verifications")
    .select("id, phone, code_hash, expires_at, attempts, consumed_at")
    .eq("id", args.requestId)
    .maybeSingle();

  if (error || !record) return { ok: false, reason: "not_found" };
  if (record.phone !== phone) return { ok: false, reason: "not_found" };
  if (record.consumed_at) return { ok: false, reason: "not_found" };
  if (new Date(record.expires_at) < new Date()) {
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many" };
  }

  const match = await bcrypt.compare(args.code, record.code_hash);
  if (!match) {
    await supabase
      .from("sms_verifications")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);
    return { ok: false, reason: "wrong" };
  }

  await supabase
    .from("sms_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", record.id);
  return { ok: true };
}
