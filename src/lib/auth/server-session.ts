import { cookies } from "next/headers";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { ACCESS_COOKIE } from "./cookies";

/**
 * Server Component 에서 admin session 조회.
 * middleware 가 이미 /admin/* 를 보호하지만,
 * 직접 admin info(이름·이메일 등)가 필요할 때 사용.
 */
export async function getAdminSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}
