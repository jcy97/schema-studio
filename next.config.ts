import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 프로덕션 빌드 중에 ESLint 검사를 비활성화합니다
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
