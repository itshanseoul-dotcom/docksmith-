import "server-only";
import { prisma } from "@/lib/prisma";

// ROADMAP 2.1 — Stripe 없이 "왜 돈을 내야 하는지"의 경계선만 먼저 긋는다.
// 플랜별 한도로 넓히는 건 2.2(Stripe 연동)에서.
export const MONTHLY_FREE_LIMIT = 20;

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
