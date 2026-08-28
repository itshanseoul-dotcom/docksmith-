"use client";

import { useEffect } from "react";
import { logClientError } from "./error-log-action";

// 루트 레이아웃 자체가 깨졌을 때만 쓰인다 — 이 파일이 레이아웃을 통째로 대체하므로
// 전역 스타일(globals.css)에 기대지 않고 인라인 스타일만 쓴다(Next.js 문서 권고).
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logClientError({
      message: error.message,
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
    });
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>문제가 발생했습니다</h2>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          잠시 후 다시 시도해주세요. 문제가 계속되면 알려주세요.
        </p>
        <button
          onClick={() => retry()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
