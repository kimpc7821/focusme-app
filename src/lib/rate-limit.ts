import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Sliding window rate limit — DB 기반 단순 카운트.
 *
 * 사용:
 *   const r = await checkAndIncrement("admin_login:" + ip, 900, 5);
 *   if (!r.ok) return 429;
 *
 * 정책:
 *   - 매 호출 시 (a) 윈도우 내 hit 카운트, (b) 한도 초과 시 reject,
 *     (c) 통과 시 INSERT.
 *   - Cleanup job 없음 — 다음 호출에서 윈도우 밖 row 는 그냥 무시.
 *
 * Redis 도입 시 이 모듈만 교체. 호출 측 시그니처 유지.
 */

export interface RateLimitResult {
  ok: boolean;
  count: number;
  remaining: number;
  retryAfterSeconds?: number;
}

export async function checkAndIncrement(
  key: string,
  windowSeconds: number,
  maxCount: number,
): Promise<RateLimitResult> {
  const supabase = createServerSupabase();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count, error } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("hit_at", since);

  if (error) {
    // DB 실패 시 fail-open — 사용자 차단보다 일시적 통과 선호.
    console.warn(`[rate-limit] count 실패: ${error.message}`);
    return { ok: true, count: 0, remaining: maxCount };
  }

  const current = count ?? 0;
  if (current >= maxCount) {
    return {
      ok: false,
      count: current,
      remaining: 0,
      retryAfterSeconds: windowSeconds,
    };
  }

  // 카운트 증가 — 통과 케이스만 기록.
  const { error: insertError } = await supabase
    .from("rate_limits")
    .insert({ key });
  if (insertError) {
    console.warn(`[rate-limit] insert 실패: ${insertError.message}`);
  }

  return {
    ok: true,
    count: current + 1,
    remaining: maxCount - current - 1,
  };
}

/**
 * 실패 카운트 명시적 기록 (예: admin login 실패).
 * 카운트만 늘리고 검사는 별도.
 */
export async function recordHit(key: string): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.from("rate_limits").insert({ key });
}

/**
 * Request 에서 클라이언트 IP 추출.
 * Vercel·Cloudflare 등 프록시 뒤에선 X-Forwarded-For 의 첫 항목이 진짜 IP.
 */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  // local dev 등 헤더 없을 때
  return "unknown";
}
