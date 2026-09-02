import "server-only";
import { prisma } from "@/lib/prisma";
import type { PlanTier } from "@/generated/prisma/client";

// null = 무제한. ROADMAP 2.2(Stripe) 가격표 그대로 — docs/PRD.md 12장.
export const PLAN_LIMITS: Record<PlanTier, number | null> = {
  FREE: 20,
  STARTER: 500,
  PRO: null,
  TEAM: null,
};

export const PLAN_LABEL: Record<PlanTier, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  TEAM: "Team",
};

// 원래 $9/$29/$79 가격표를 1,450원 환율 기준으로 원화 환산한 값 — 한국 PG(포트원/
// KG이니시스/NHN KCP)는 원화로만 결제받으므로, 화면에 보여주는 가격과 실제 청구
// 금액이 반드시 이 값으로 일치해야 한다(PG 심사에서 "임의가격" 여부를 확인함).
export const PLAN_PRICE_KRW: Record<PlanTier, number> = {
  FREE: 0,
  STARTER: 13_050,
  PRO: 42_050,
  TEAM: 114_550,
};

export async function getMonthlyUsage(organizationId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await prisma.generationJob.aggregate({
    where: {
      template: { organizationId },
      createdAt: { gte: monthStart },
    },
    _sum: { rowCount: true },
  });

  return result._sum.rowCount ?? 0;
}

export async function getPlanLimit(organizationId: string): Promise<number | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { planTier: true },
  });
  return PLAN_LIMITS[org?.planTier ?? "FREE"];
}
