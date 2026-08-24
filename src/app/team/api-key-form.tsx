"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApiKey, type CreateApiKeyState } from "./api-key-actions";

const initialState: CreateApiKeyState = undefined;

export function ApiKeyForm() {
  const [state, action, pending] = useActionState(createApiKey, initialState);

  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex items-center gap-2">
        <Input name="name" placeholder="키 이름 (예: 재고관리 시스템)" className="h-9" />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "만드는 중..." : "새 API 키 만들기"}
        </Button>
      </form>

      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {state && "plaintext" in state && (
        <div className="flex flex-col gap-1 rounded-md border border-primary/40 bg-primary/5 p-3">
          <p className="text-xs font-medium text-destructive">
            지금만 보여드립니다 — 안전한 곳에 복사해두세요. 다시 볼 수 없습니다.
          </p>
          <code className="break-all rounded bg-background px-2 py-1 text-xs">
            {state.plaintext}
          </code>
        </div>
      )}
    </div>
  );
}
