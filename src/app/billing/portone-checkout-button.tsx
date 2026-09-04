"use client";

import { useState, useTransition } from "react";
import PortOne from "@portone/browser-sdk/v2";
import { Button } from "@/components/ui/button";
import { activatePortOneBilling } from "./actions";
import type { SubscribablePlan } from "@/lib/portone";

const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID!;
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!;

export function PortOneCheckoutButton({
  plan,
  orderName,
  customerEmail,
}: {
  plan: SubscribablePlan;
  orderName: string;
  customerEmail: string;
}) {
  const [isIssuing, setIsIssuing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const busy = isIssuing || isPending;

  async function handleClick() {
    setError(null);
    setIsIssuing(true);
    try {
      const response = await PortOne.requestIssueBillingKey({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        billingKeyMethod: "CARD",
        issueId: `issue-${plan}-${Date.now()}`,
        issueName: orderName,
        customer: { email: customerEmail },
        redirectUrl: `${window.location.origin}/billing`,
      });

      if (!response || response.code) {
        setError(response?.message ?? "카드 등록에 실패했습니다.");
        return;
      }

      startTransition(async () => {
        const result = await activatePortOneBilling(plan, response.billingKey);
        if (result?.error) {
          setError(result.error);
        }
      });
    } finally {
      setIsIssuing(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" size="sm" onClick={handleClick} disabled={busy}>
        {busy ? "처리 중..." : "선택하기"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
