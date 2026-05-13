import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

/**
 * /admin/* 진입 시 admin access cookie 검증.
 *   - 토큰 없음 / 검증 실패 / role 불일치 → /admin/login 으로 redirect.
 *   - /admin/login 자체는 예외.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return redirectToLogin(request);

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== "admin") return redirectToLogin(request);
  } catch {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
