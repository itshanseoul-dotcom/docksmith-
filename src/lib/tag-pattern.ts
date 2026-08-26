// {invoice_no} 같은 태그 문법 — 업로드 시 감지(src/lib/template-tags.ts, 서버)와
// 생성 시 치환(fill-xlsx.ts, 브라우저 Worker) 양쪽에서 같은 정규식을 써야 어긋나지
// 않는다. server-only 의존성이 없는 파일에 둬서 두 환경 모두에서 가져다 쓸 수 있게 한다.
export const TAG_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;
