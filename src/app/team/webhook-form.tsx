"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createWebhook, type CreateWebhookState } from "./webhook-actions";

const initialState: CreateWebhookState = undefined;

export function WebhookForm() {
  const [state, action, pending] = useActionState(createWebhook, initialState);

  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex items-center gap-2">
        <input
          type="url"
          name="url"
          placeholder="https://hooks.zapier.com/..."
          required
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "추가하는 중..." : "추가"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
