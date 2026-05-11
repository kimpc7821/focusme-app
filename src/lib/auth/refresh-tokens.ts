import { createServerSupabase } from "@/lib/supabase/server";
import type { Actor } from "./jwt";

/**
 * Refresh token rotation 정책:
 *  - 로그인 시 발급: refresh_tokens 테이블에 (jti, actor_type, actor_id, expires_at) INSERT.
 *  - refresh 호출 시: 이전 jti revoked=true → 새 jti 발급 + INSERT.
 *  - logout 호출 시: jti revoked=true.
 *  - 검증: jti가 DB에 있고 revoked=false 인지 확인.
 */

export async function persistRefreshToken(args: {
  jti: string;
  actorType: Actor;
  actorId: string;
  expiresAt: Date;
}): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.from("refresh_tokens").insert({
    jti: args.jti,
    actor_type: args.actorType,
    actor_id: args.actorId,
    expires_at: args.expiresAt.toISOString(),
    revoked: false,
  });
}

export async function isRefreshTokenActive(jti: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("refresh_tokens")
    .select("revoked, expires_at")
    .eq("jti", jti)
    .maybeSingle();
  if (error || !data) return false;
  if (data.revoked) return false;
  if (new Date(data.expires_at) < new Date()) return false;
  return true;
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  const supabase = createServerSupabase();
  await supabase
    .from("refresh_tokens")
    .update({ revoked: true })
    .eq("jti", jti);
}
