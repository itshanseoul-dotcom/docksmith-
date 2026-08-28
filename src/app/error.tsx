"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logClientError } from "./error-log-action";

export default function Error({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">문제가 발생했습니다</h2>
      <p className="text-sm text-muted-foreground">
        잠시 후 다시 시도해주세요. 문제가 계속되면 알려주세요.
      </p>
      <Button onClick={() => retry()}>다시 시도</Button>
    </div>
  );
}
