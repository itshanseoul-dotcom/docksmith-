import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지 크기를 줄이기 위해 필요한 파일만 추출한 standalone 빌드 산출물 생성
  output: "standalone",
};

export default nextConfig;
