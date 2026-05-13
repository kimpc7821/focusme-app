"use server";

import { cookies } from "next/headers";
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

export interface LoginState {
  error?: string;
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

  const supabase = createServerSupabase();
  const { data: admin } = await supabase
    .from("admins")
    .select("id, email, name, password_hash, active")
    .eq("email", email)
    .maybeSingle();

  if (!admin || !admin.active) {
    return { error: "이메일 또는 비밀번호가 일치하지 않습니다" };
  }
  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) {
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
