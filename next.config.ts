import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
