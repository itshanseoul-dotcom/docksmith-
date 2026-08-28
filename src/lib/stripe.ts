import "server-only";
import Stripe from "stripe";
import type { PlanTier } from "@/generated/prisma/client";

let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!cachedClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY가 설정되지 않았습니다. .env.local에 추가해주세요.");
    }
    cachedClient = new Stripe(key);
  }
  return cachedClient;
}

export type CheckoutPlan = "STARTER" | "PRO";

// Team은 로드맵상 "팀 공유"가 핵심 차별점이라 결제 흐름을 별도로 다룰 수 있지만,
// 지금은 Stripe Checkout 대상이 Starter/Pro 두 개뿐이다(ROADMAP 2.2 scope).
export function getPriceId(plan: CheckoutPlan): string {
  const envVar = plan === "STARTER" ? "STRIPE_PRICE_STARTER" : "STRIPE_PRICE_PRO";
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new Error(
      `${envVar}가 설정되지 않았습니다. Stripe 대시보드에서 ${plan} 플랜용 월간 구독 Price를 만들고 그 Price ID를 .env.local에 추가해주세요.`
    );
  }
  return priceId;
}

export function planFromPriceId(priceId: string): PlanTier | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return null;
}
