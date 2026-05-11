import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * 서버 전용 Supabase 클라이언트 (service_role).
 * RSC · Route Handler · Server Action에서만 사용. 절대 클라이언트 번들로 흘러가면 안 됨.
 *
 * MVP는 RLS 비활성 + 백엔드 권한 체크 정책이라 service_role로 단일화.
 * 추후 클라이언트 측 mutation 도입 시 anon + RLS로 분리.
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 를 설정하세요.",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
