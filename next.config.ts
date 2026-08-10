import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone"은 Docker/자체 호스팅용이라 Vercel 배포와 충돌한다(빌드 산출물이
  // 달라짐). Vercel로 배포하는 동안은 켜지 않는다 — 나중에 다시 Docker로 옮기면 그때 켠다.
  experimental: {
    // 기본 1MB로는 템플릿 PDF 업로드가 막힌다 (실제 크기 제한은 앱 코드에서 별도 검증).
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
