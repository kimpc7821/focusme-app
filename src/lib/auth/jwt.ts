import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";

const ACCESS_EXPIRES = Number(process.env.JWT_ACCESS_EXPIRES ?? 3600);
const REFRESH_EXPIRES = Number(process.env.JWT_REFRESH_EXPIRES ?? 2592000);

export type Actor = "admin" | "client";

export interface AccessTokenPayload {
  sub: string;
  role: Actor;
  email?: string;
  name?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  role: Actor;
  jti: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET 환경변수가 없습니다");
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_EXPIRES}s`)
    .sign(secretKey());
}

export async function signRefreshToken(
  sub: string,
  role: Actor,
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES * 1000);
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_EXPIRES}s`)
    .sign(secretKey());
  return { token, jti, expiresAt };
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: String(payload.sub),
      role: payload.role as Actor,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.jti || !payload.sub) return null;
    return {
      sub: String(payload.sub),
      role: payload.role as Actor,
      jti: String(payload.jti),
    };
  } catch {
    return null;
  }
}

export const TOKEN_EXPIRES = {
  access: ACCESS_EXPIRES,
  refresh: REFRESH_EXPIRES,
};
