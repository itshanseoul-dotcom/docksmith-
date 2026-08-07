import "server-only";
import { prisma } from "@/lib/prisma";

// MVP는 1 계정 = 1 org (ROADMAP 1.2). 로그인/가입 직후 org가 없으면 만들어준다.
export async function ensureOrganization(authUserId: string, defaultName: string) {
  return prisma.organization.upsert({
    where: { ownerAuthUserId: authUserId },
    update: {},
    create: { ownerAuthUserId: authUserId, name: defaultName },
  });
}
