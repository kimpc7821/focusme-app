/**
 * 카카오 로그인 토큰 검증.
 *
 * KAKAO_PROVIDER 환경변수로 모드 선택:
 *   - "mock"  : 토큰 자체를 kakaoId 로 간주 (개발/테스트). 토큰 prefix 'mock_' 만 허용해
 *               실수로 production 에서 활성화돼도 외부 토큰을 통과시키지 않도록.
 *   - "real"  : kapi.kakao.com/v2/user/me 호출해 실제 검증.
 *
 * 실 카카오 dev 앱 키가 들어오면 KAKAO_PROVIDER=real 로 스위치.
 * reference: docs/focusme-api-spec.md §1.1
 */

export interface KakaoProfile {
  kakaoId: string;
  nickname?: string;
  email?: string;
  phone?: string;
}

const PROVIDER = process.env.KAKAO_PROVIDER ?? "mock";

export async function verifyKakaoAccessToken(
  accessToken: string,
): Promise<KakaoProfile | null> {
  if (!accessToken) return null;

  if (PROVIDER === "mock") {
    // mock 모드: 'mock_<kakaoId>[:nickname]' 형식만 허용.
    // production 에서 실수로 mock 모드가 활성돼도 prefix 검사로 무력화.
    if (!accessToken.startsWith("mock_")) return null;
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[kakao] mock provider is active in production — refusing token.",
      );
      return null;
    }
    const body = accessToken.slice("mock_".length);
    const [kakaoId, nickname] = body.split(":");
    if (!kakaoId) return null;
    return { kakaoId, nickname: nickname || undefined };
  }

  // real 모드: kakao REST API 호출
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    id?: number | string;
    kakao_account?: {
      email?: string;
      phone_number?: string;
      profile?: { nickname?: string };
    };
  };

  if (!data.id) return null;
  return {
    kakaoId: String(data.id),
    nickname: data.kakao_account?.profile?.nickname,
    email: data.kakao_account?.email,
    phone: data.kakao_account?.phone_number,
  };
}
