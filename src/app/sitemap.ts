import type { MetadataRoute } from "next";

const BASE_URL = "https://docksmith.vercel.app";

// 로그인 뒤에 있는 화면(대시보드/템플릿 등)은 검색엔진이 색인해봐야 의미가 없어서
// 뺀다 — 여기 있는 건 전부 로그인 없이 볼 수 있는 공개 페이지들이다.
const SEO_LANDING_PAGES = [
  "commercial-invoice-generator",
  "packing-list-generator",
  "fedex-invoice-generator",
  "dhl-invoice-generator",
  "tsca-generator",
  "msds-generator",
  "export-declaration-generator",
  "payslip-generator",
  "employment-certificate-generator",
  "employment-contract-generator",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...SEO_LANDING_PAGES.map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
