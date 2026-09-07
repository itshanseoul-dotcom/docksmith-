import type { MetadataRoute } from "next";

const BASE_URL = "https://docksmith.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 로그인 뒤에 있는 화면들은 검색엔진이 들어가도 어차피 로그인 페이지로
      // 튕겨나가므로 색인 예산 낭비만 된다.
      disallow: ["/dashboard", "/billing", "/team", "/templates", "/invite"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
