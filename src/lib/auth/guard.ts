import { NextResponse } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";

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
