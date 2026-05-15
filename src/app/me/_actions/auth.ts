"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyKakaoAccessToken } from "@/lib/auth/kakao";
import {
  generateAndSendSmsCode,
  isValidKoreanPhone,
  normalizePhone,
  verifySmsCode,
} from "@/lib/auth/sms";
import {
  createClientFromKakao,
  createClientFromPhone,
  findClientByKakaoId,
  findClientByPhone,
  linkKakaoToClient,
  type ClientRow,
} from "@/lib/db/clients";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  TOKEN_EXPIRES,
} from "@/lib/auth/jwt";
import {
  persistRefreshToken,
  revokeRefreshToken,
} from "@/lib/auth/refresh-tokens";
import {
  CLIENT_ACCESS_COOKIE,
  CLIENT_REFRESH_COOKIE,
  buildCookieOptions,
  buildClearCookieOptions,
} from "@/lib/auth/cookies";
import { createServerSupabase } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { getClientSession } from "@/lib/auth/client-session";

/**
 * /login 페이지의 form action 들.
 * /api/v1/auth/* 와 동일 로직 — server action 으로 wrap 해서 useActionState 패턴에 맞춤.
 */

// ─── 카카오 mock 로그인 ────────────────────────────────────────────
export interface KakaoLoginState {
  error?: string;
}

export async function kakaoLoginAction(
  _prev: KakaoLoginState,
  formData: FormData,
): Promise<KakaoLoginState> {
  const token = String(formData.get("kakaoAccessToken") ?? "").trim();
  const from = String(formData.get("from") ?? "/me");

  if (!token) return { error: "카카오 토큰이 비었습니다" };

  const profile = await verifyKakaoAccessToken(token);
  if (!profile) return { error: "유효하지 않은 카카오 토큰입니다" };

  let client: ClientRow | null = await findClientByKakaoId(profile.kakaoId);
  if (!client && profile.phone) {
    const np = normalizePhone(profile.phone);
    const byPhone = await findClientByPhone(np);
    if (byPhone && !byPhone.kakao_id) {
      await linkKakaoToClient(byPhone.id, profile.kakaoId);
      client = { ...byPhone, kakao_id: profile.kakaoId };
    }
  }
  if (!client) {
    client = await createClientFromKakao({
      kakaoId: profile.kakaoId,
      email: profile.email,
      phone: profile.phone ? normalizePhone(profile.phone) : undefined,
      nickname: profile.nickname,
    });
  }

  if (client.status !== "active") {
    return { error: "비활성 상태의 계정입니다" };
  }

  await issueClientSession(client);
  redirect(safeRedirect(from));
}

// ─── SMS 인증번호 발송 ────────────────────────────────────────────
export interface SmsRequestState {
  error?: string;
  requestId?: string;
  phone?: string;
  devCode?: string;
}

export async function smsRequestAction(
  _prev: SmsRequestState,
  formData: FormData,
): Promise<SmsRequestState> {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  if (!phoneRaw) return { error: "휴대폰 번호를 입력해주세요" };

  const phone = normalizePhone(phoneRaw);
  if (!isValidKoreanPhone(phone)) {
    return { error: "올바른 휴대폰 번호 형식이 아닙니다 (010-XXXX-XXXX)" };
  }

  let result;
  try {
    result = await generateAndSendSmsCode(phone);
  } catch (err) {
    return {
      error:
        "발송 실패: " + (err instanceof Error ? err.message : String(err)),
    };
  }

  if (!result.ok) {
    return {
      error: "발송 횟수가 많습니다. 잠시 후 다시 시도해주세요",
      phone,
    };
  }

  return {
    requestId: result.requestId,
    phone,
    devCode: result.devCode,
  };
}

// ─── SMS 인증번호 확인 + 로그인 ───────────────────────────────────
export interface SmsVerifyState {
  error?: string;
  // 발송 단계 결과를 다시 받아 form 상태 유지에 사용.
  requestId?: string;
  phone?: string;
  devCode?: string;
}

export async function smsVerifyAction(
  _prev: SmsVerifyState,
  formData: FormData,
): Promise<SmsVerifyState> {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const from = String(formData.get("from") ?? "/me");

  if (!requestId || !phoneRaw || !code) {
    return { error: "인증번호를 입력해주세요", requestId, phone: phoneRaw };
  }

  const phone = normalizePhone(phoneRaw);
  const verdict = await verifySmsCode({ requestId, phone, code });
  if (!verdict.ok) {
    const msg = {
      not_found: "인증 요청을 찾을 수 없습니다",
      expired: "인증번호가 만료되었습니다. 다시 발송해주세요",
      too_many: "시도 횟수를 초과했습니다. 다시 발송해주세요",
      wrong: "인증번호가 일치하지 않습니다",
    }[verdict.reason];
    return { error: msg, requestId, phone };
  }

  let client = await findClientByPhone(phone);
  if (!client) {
    client = await createClientFromPhone({ phone });
  }
  if (client.status !== "active") {
    return { error: "비활성 상태의 계정입니다", requestId, phone };
  }

  await issueClientSession(client);
  redirect(safeRedirect(from));
}

// ─── id(휴대폰)/pw 로그인 ─────────────────────────────────────────
export interface PasswordLoginState {
  error?: string;
  phone?: string;
}

export async function passwordLoginAction(
  _prev: PasswordLoginState,
  formData: FormData,
): Promise<PasswordLoginState> {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/me");

  if (!phoneRaw || !password) {
    return { error: "휴대폰 번호와 비밀번호를 입력해주세요", phone: phoneRaw };
  }
  const phone = normalizePhone(phoneRaw);

  const supabase = createServerSupabase();
  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, status, password_hash, must_change_password, business_name",
    )
    .eq("phone", phone)
    .maybeSingle();

  if (!client || !client.password_hash) {
    return {
      error: "등록되지 않은 번호이거나 비밀번호가 설정되지 않았습니다",
      phone,
    };
  }
  const ok = await verifyPassword(password, client.password_hash);
  if (!ok) {
    return { error: "비밀번호가 일치하지 않습니다", phone };
  }
  if (client.status !== "active") {
    return { error: "비활성 상태의 계정입니다", phone };
  }

  await issueClientSession({
    id: client.id,
    phone,
    kakao_id: null,
    email: null,
    business_name: client.business_name,
    business_type: null,
    status: client.status,
    payment_status: "",
  });

  if (client.must_change_password) {
    redirect(`/change-password?next=${encodeURIComponent(safeRedirect(from))}`);
  }
  redirect(safeRedirect(from));
}

// ─── 비밀번호 변경 (임시 pw → 본인 pw) ────────────────────────────
export interface ChangePasswordState {
  error?: string;
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const next = String(formData.get("next") ?? "/me");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (newPassword.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다" };
  }
  if (newPassword !== confirm) {
    return { error: "비밀번호가 일치하지 않습니다" };
  }

  const session = await getClientSession();
  if (!session) redirect("/login");

  const passwordHash = await hashPassword(newPassword);
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ password_hash: passwordHash, must_change_password: false })
    .eq("id", session.sub);

  if (error) return { error: error.message };

  redirect(safeRedirect(next));
}

// ─── 로그아웃 ──────────────────────────────────────────────────────
export async function clientLogoutAction() {
  const store = await cookies();
  const refresh = store.get(CLIENT_REFRESH_COOKIE)?.value;
  if (refresh) {
    const payload = await verifyRefreshToken(refresh);
    if (payload) await revokeRefreshToken(payload.jti);
  }
  store.set(CLIENT_ACCESS_COOKIE, "", buildClearCookieOptions());
  store.set(CLIENT_REFRESH_COOKIE, "", buildClearCookieOptions());
  redirect("/login");
}

// ─── helpers ──────────────────────────────────────────────────────
async function issueClientSession(client: ClientRow) {
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
  const store = await cookies();
  store.set(
    CLIENT_ACCESS_COOKIE,
    accessToken,
    buildCookieOptions(TOKEN_EXPIRES.access),
  );
  store.set(
    CLIENT_REFRESH_COOKIE,
    refresh.token,
    buildCookieOptions(TOKEN_EXPIRES.refresh),
  );
}

function safeRedirect(from: string): string {
  if (from.startsWith("/me") && !from.startsWith("//")) return from;
  return "/me";
}
