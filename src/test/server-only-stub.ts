// vitest용 "server-only" 스텁 — 실제 배포/브라우저 빌드에서는 real 패키지가 그대로
// 쓰이고(브라우저 번들에 섞이면 즉시 에러), 테스트에서만 이걸로 바꿔치기해서
// server-only로 가드된 모듈(lib/membership.ts 등)을 Node에서 임포트할 수 있게 한다.
export {};
