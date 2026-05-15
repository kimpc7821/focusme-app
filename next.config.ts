import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  // MIME 스니핑 차단
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 외부 도메인에서 iframe 으로 임베드 금지 (clickjacking 방지)
  { key: "X-Frame-Options", value: "DENY" },
  // Referrer 정책 — same-origin 은 풀, cross-origin 은 origin 만
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 위험한 권한 (카메라·마이크·위치 등) 기본 거부
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // 전역 보안 헤더
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async redirects() {
    return [
      // www → apex (영구). 운영 도메인에서만 발동, 로컬에는 영향 없음.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.focusme.kr" }],
        destination: "https://focusme.kr/:path*",
        permanent: true,
      },
      // 보조 도메인 focusme.co.kr 도 함께 등록한다면 활성화.
      // {
      //   source: "/:path*",
      //   has: [{ type: "host", value: "focusme.co.kr" }],
      //   destination: "https://focusme.kr/:path*",
      //   permanent: true,
      // },
    ];
  },
};

export default nextConfig;
