import { cookies } from "next/headers";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { CLIENT_ACCESS_COOKIE } from "./cookies";

/**
 * Server Component 에서 client(사장님) session 조회.
 * proxy 가 이미 /me/* 를 보호하지만,
 * client info(이름·id 등)가 직접 필요할 때 사용.
 */
export async function getClientSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(CLIENT_ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "client") return null;
  return payload;
}
