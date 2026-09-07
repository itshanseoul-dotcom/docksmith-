import type { Metadata } from "next";

// 각 페이지가 title/description을 반복해서 openGraph·twitter 카드까지 손으로
// 채우지 않아도 되게 한 번에 만들어준다 — 링크를 카톡/트위터 등에 공유했을 때
// 미리보기(이미지·제목·설명)가 정상적으로 뜨려면 이 필드들이 필요하다.
export function pageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Docksmith",
      locale: "ko_KR",
      // 루트의 opengraph-image.tsx는 이 페이지가 자체 openGraph 객체를 지정하는
      // 순간 자동으로 상속되지 않는다(Next.js 내부적으로 "이 세그먼트가 자체
      // openGraph.images를 지정하지 않았을 때만" 파일 기반 이미지를 병합하는데,
      // 하위 세그먼트 자신의 openGraph 객체가 있으면 그 병합이 일어나지 않는다)
      // — 그래서 명시적으로 같은 이미지를 다시 참조해준다.
      images: "/opengraph-image",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: "/opengraph-image",
    },
  };
}
