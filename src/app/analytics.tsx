import Script from "next/script";

// GA4는 완전 무료(월 몇백만 이벤트까지)라 사용자 늘어도 비용이 안 붙는다 — 사용자
// 원칙(비용이 매출과 무관하게 늘어나는 구조 지양)에 부합한다. 로컬 개발 중에는 이
// 값을 안 넣어두면(=.env.local에 없으면) 아무것도 렌더링하지 않아 개발 트래픽이
// 실제 통계에 안 섞인다.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
