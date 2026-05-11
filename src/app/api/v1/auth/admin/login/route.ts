import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/passwords";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { persistRefreshToken } from "@/lib/auth/refresh-tokens";

interface Body {
  email?: string;
  password?: string;
}

/**
 * POST /api/v1/auth/admin/login
 * reference: docs/focusme-api-spec.md §1.6
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

  return NextResponse.json({
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
}
