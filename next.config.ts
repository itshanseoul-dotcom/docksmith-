import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지 크기를 줄이기 위해 필요한 파일만 추출한 standalone 빌드 산출물 생성
  output: "standalone",
  experimental: {
    // 기본 1MB로는 템플릿 PDF 업로드가 막힌다 (실제 크기 제한은 앱 코드에서 별도 검증).
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
