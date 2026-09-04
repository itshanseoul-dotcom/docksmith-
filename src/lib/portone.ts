import "server-only";
import { PortOneClient } from "@portone/server-sdk";
import type { PlanTier } from "@/generated/prisma/client";

let cachedClient: PortOneClient | null = null;

export function getPortOneClient(): PortOneClient {
  if (!cachedClient) {
    const secret = process.env.PORTONE_API_SECRET;
    if (!secret) {
      throw new Error("PORTONE_API_SECRET가 설정되지 않았습니다. .env.local에 추가해주세요.");
    }
    cachedClient = PortOneClient({ secret });
  }
  return cachedClient;
}

export type SubscribablePlan = "STARTER" | "PRO";

export function orderName(plan: PlanTier): string {
  return `Docksmith ${plan} 요금제`;
}

// 스케줄 결제(2회차 이후)와 최초 결제를 웹훅에서 구분하기 위한 접두사.
// 최초 결제는 서버 액션이 다음 회차를 즉시 예약하므로, 그 결제 건에 대한
// Transaction.Paid 웹훅은 아무 것도 하지 않고 무시해야 한다(안 그러면 예약이 중복된다).
export const PAYMENT_ID_PREFIX = { initial: "init", scheduled: "sched" } as const;

export function makePaymentId(kind: keyof typeof PAYMENT_ID_PREFIX, organizationId: string): string {
  return `${PAYMENT_ID_PREFIX[kind]}-${organizationId}-${Date.now()}`;
}

export function organizationIdFromPaymentId(paymentId: string): string | null {
  const [prefix, organizationId] = paymentId.split("-");
  if (prefix !== PAYMENT_ID_PREFIX.initial && prefix !== PAYMENT_ID_PREFIX.scheduled) return null;
  return organizationId || null;
}

export function isScheduledPaymentId(paymentId: string): boolean {
  return paymentId.startsWith(`${PAYMENT_ID_PREFIX.scheduled}-`);
}

// 다음 결제 예정일 — 매달 같은 날짜에 청구. 31일처럼 다음 달에 없는 날짜면
// Date가 자동으로 다음 달로 넘겨버리므로(예: 1/31 + 1개월 = 3/3), 그 경우
// 다음 달의 마지막 날로 보정한다.
export function addOneMonth(from: Date): Date {
  const day = from.getDate();
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1, 1);
  const lastDayOfNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDayOfNextMonth));
  return next;
}
