import { NextResponse } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { CLIENT_ACCESS_COOKIE } from "./cookies";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Authorization: Bearer <token> 검증.
 * 성공: payload 반환. 실패: NextResponse(401)을 throw 형태로 반환.
 * 사용 패턴:
 *   const auth = await requireAuth(request, 'admin');
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.sub, auth.role 사용
 */
export async function requireAuth(
  request: Request,
  role?: "admin" | "client",
): Promise<AccessTokenPayload | NextResponse> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "인증 토큰이 없습니다" } },
      { status: 401 },
    );
  }
  const token = header.slice(7).trim();
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다" } },
      { status: 401 },
    );
  }
  if (role && payload.role !== role) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "권한이 부족합니다" } },
      { status: 403 },
    );
  }
  return payload;
}

/**
 * Client(사장님) auth — Authorization Bearer OR CLIENT_ACCESS_COOKIE 둘 다 인식.
 * /me/* API 는 브라우저(쿠키) 와 외부 API client(헤더) 양쪽 다 지원.
 */
export async function requireClientAuth(
  request: Request,
): Promise<AccessTokenPayload | NextResponse> {
  let token: string | undefined;

  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  } else {
    // 쿠키 폴백 — Request 의 cookie header 파싱
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${CLIENT_ACCESS_COOKIE}=([^;]+)`),
    );
    if (match) token = decodeURIComponent(match[1]);
  }

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "인증 토큰이 없습니다" } },
      { status: 401 },
    );
  }

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "client") {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다" } },
      { status: 401 },
    );
  }
  return payload;
}

/**
 * 페이지가 해당 클라이언트 소유인지 검사.
 * 소유 OK: page row 반환. 미소유 또는 미존재: NextResponse(403/404).
 * IDOR 방지를 위해 둘 다 403 으로 통일하지 않고 의도적으로 분리 — 디버깅 편의.
 * 보안 강화 필요시 둘 다 404 로 통일 가능.
 */
export async function ensureClientOwnsPage(
  clientId: string,
  pageId: string,
): Promise<
  | { id: string; slug: string; client_id: string; status: string }
  | NextResponse
> {
  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, client_id, status")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "페이지가 없습니다" } },
      { status: 404 },
    );
  }
  if (page.client_id !== clientId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "본인 페이지가 아닙니다" } },
      { status: 403 },
    );
  }
  return page;
}
