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
