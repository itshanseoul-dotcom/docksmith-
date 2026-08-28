"use client";

import { useEffect } from "react";
import { logClientError } from "./error-log-action";

// error.tsx/global-error.tsx는 React 렌더링 중 던진 에러만 잡는다. 이벤트 핸들러나
// Web Worker, 타이머 콜백 안에서 나는 에러는 React 경계를 안 거치므로 따로
// window 레벨에서 잡아야 한다.
export function ClientErrorListener() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      logClientError({
        message: event.message,
        stack: event.error?.stack ?? null,
        url: window.location.href,
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      logClientError({
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? (reason.stack ?? null) : null,
        url: window.location.href,
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
