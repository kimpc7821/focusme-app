import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE, CLIENT_ACCESS_COOKIE } from "@/lib/auth/cookies";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

/**
 * /admin/* · /me/* 진입 시 access cookie 검증.
 *   - 토큰 없음 / 검증 실패 / role 불일치 → 해당 로그인 페이지로 redirect.
 *   - 로그인 페이지 자체는 예외.
 *
 * Next 16 에서 middleware → proxy 로 컨벤션 변경.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (path === "/admin/login") return NextResponse.next();
    return guard(request, ACCESS_COOKIE, "admin", "/admin/login");
  }

  if (path.startsWith("/me")) {
    return guard(request, CLIENT_ACCESS_COOKIE, "client", "/login");
  }

  return NextResponse.next();
}

async function guard(
  request: NextRequest,
  cookieName: string,
  role: "admin" | "client",
  loginPath: string,
) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return redirectToLogin(request, loginPath);
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== role) return redirectToLogin(request, loginPath);
  } catch {
    return redirectToLogin(request, loginPath);
  }
  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/me/:path*"],
};
