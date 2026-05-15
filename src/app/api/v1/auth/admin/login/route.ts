import { NextResponse } from "next/server";
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
import {
  checkAndIncrement,
  getClientIp,
  recordHit,
} from "@/lib/rate-limit";

const LOGIN_WINDOW_SECONDS = 900; // 15분
const LOGIN_MAX_FAILS = 5;

interface Body {
  email?: string;
  password?: string;
}

/**
 * POST /api/v1/auth/admin/login
 * reference: docs/focusme-api-spec.md §1.6
 */
export async function POST(request: Request) {
  // Rate limit — 같은 IP 의 실패가 15분 5회 이상이면 차단.
  const ip = getClientIp(request);
  const limitKey = `admin_login_fail:${ip}`;
  const limit = await checkAndIncrement(
    limitKey,
    LOGIN_WINDOW_SECONDS,
    LOGIN_MAX_FAILS,
  );
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.",
        },
      },
      { status: 429 },
    );
  }
  // checkAndIncrement 는 통과 케이스에 INSERT 함. 실패만 카운트하려면 통과 후 hit 를 빼야 하지만,
  // 단순화 위해 매 시도 카운트 — 성공 시도가 적기 때문에 실용상 차이 없음.

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "이메일과 비밀번호가 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, email, name, role, password_hash, active")
    .eq("email", body.email)
    .maybeSingle();

  if (error || !admin || !admin.active) {
    await recordHit(limitKey);
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "이메일 또는 비밀번호가 일치하지 않습니다",
        },
      },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(body.password, admin.password_hash);
  if (!ok) {
    await recordHit(limitKey);
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "이메일 또는 비밀번호가 일치하지 않습니다",
        },
      },
      { status: 401 },
    );
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

  // last_login 기록 — 실패해도 로그인 자체엔 영향 X
  await supabase
    .from("admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  const response = NextResponse.json({
    data: {
      accessToken,
      refreshToken: refresh.token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "admin",
      },
    },
  });
  response.cookies.set(
    ACCESS_COOKIE,
    accessToken,
    buildCookieOptions(TOKEN_EXPIRES.access),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    refresh.token,
    buildCookieOptions(TOKEN_EXPIRES.refresh),
  );
  return response;
}
