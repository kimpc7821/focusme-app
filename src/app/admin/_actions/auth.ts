"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { revokeRefreshToken } from "@/lib/auth/refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildClearCookieOptions,
} from "@/lib/auth/cookies";
import { getAdminSession } from "@/lib/auth/server-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";

export async function logoutAction() {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const payload = await verifyRefreshToken(refresh);
    if (payload) await revokeRefreshToken(payload.jti);
  }
  store.set(ACCESS_COOKIE, "", buildClearCookieOptions());
  store.set(REFRESH_COOKIE, "", buildClearCookieOptions());
  redirect("/admin/login");
}

export interface ChangeAdminPwState {
  error?: string;
  success?: string;
}

export async function changeAdminPasswordAction(
  _prev: ChangeAdminPwState,
  formData: FormData,
): Promise<ChangeAdminPwState> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next) {
    return { error: "현재·새 비밀번호를 입력해주세요" };
  }
  if (next.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다" };
  }
  if (next !== confirm) {
    return { error: "새 비밀번호가 일치하지 않습니다" };
  }

  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = createServerSupabase();
  const { data: admin } = await supabase
    .from("admins")
    .select("id, password_hash")
    .eq("id", session.sub)
    .maybeSingle();
  if (!admin) {
    return { error: "계정을 찾을 수 없습니다" };
  }

  const ok = await verifyPassword(current, admin.password_hash);
  if (!ok) {
    return { error: "현재 비밀번호가 일치하지 않습니다" };
  }

  const passwordHash = await hashPassword(next);
  const { error } = await supabase
    .from("admins")
    .update({ password_hash: passwordHash })
    .eq("id", admin.id);
  if (error) {
    return { error: error.message };
  }

  return { success: "비밀번호가 변경되었습니다" };
}
