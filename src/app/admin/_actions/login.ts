"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/passwords";
import {
  signAccessToken,
  signRefreshToken,
  TOKEN_EXPIRES,
} from "@/lib/auth/jwt";
import { persistRefreshToken } from "@/lib/auth/refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildCookieOptions,
} from "@/lib/auth/cookies";
import { checkAndIncrement, recordHit } from "@/lib/rate-limit";

const LOGIN_WINDOW_SECONDS = 900;
const LOGIN_MAX_FAILS = 5;

export interface LoginState {
  error?: string;
}

async function getRequestIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() ?? "unknown";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin/tasks");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요" };
  }

  const ip = await getRequestIp();
  const limitKey = `admin_login_fail:${ip}`;
  const limit = await checkAndIncrement(
    limitKey,
    LOGIN_WINDOW_SECONDS,
    LOGIN_MAX_FAILS,
  );
  if (!limit.ok) {
    return { error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요." };
  }

  const supabase = createServerSupabase();
  const { data: admin } = await supabase
    .from("admins")
    .select("id, email, name, password_hash, active")
    .eq("email", email)
    .maybeSingle();

  if (!admin || !admin.active) {
    await recordHit(limitKey);
    return { error: "이메일 또는 비밀번호가 일치하지 않습니다" };
  }
  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) {
    await recordHit(limitKey);
    return { error: "이메일 또는 비밀번호가 일치하지 않습니다" };
  }

  const accessToken = await signAccessToken({
    sub: admin.id,
    role: "admin",
    email: admin.email,
    name: admin.name,
  });
  const refresh = await signRefreshToken(admin.id, "admin");
  await persistRefreshToken({
    jti: refresh.jti,
    actorType: "admin",
    actorId: admin.id,
    expiresAt: refresh.expiresAt,
  });
  await supabase
    .from("admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  const store = await cookies();
  store.set(
    ACCESS_COOKIE,
    accessToken,
    buildCookieOptions(TOKEN_EXPIRES.access),
  );
  store.set(
    REFRESH_COOKIE,
    refresh.token,
    buildCookieOptions(TOKEN_EXPIRES.refresh),
  );

  // 안전한 redirect 경로만 허용 (open redirect 방지)
  const safeFrom =
    from.startsWith("/admin") && !from.startsWith("//") ? from : "/admin/tasks";
  redirect(safeFrom);
}
