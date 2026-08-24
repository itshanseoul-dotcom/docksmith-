import "server-only";
import { prisma } from "@/lib/prisma";

// V1부터는 Membership이 "이 사용자가 지금 속한 org"의 소스다. 이미 멤버십이 있으면
// (초대를 수락해 다른 org에 속해 있을 수 있다) 그 org를 그대로 쓰고, 없으면 자기
// 소유 org를 upsert한 뒤 OWNER로 가입시킨다.
export async function ensureOrganization(authUserId: string, defaultName: string) {
  const membership = await prisma.membership.findUnique({
    where: { authUserId },
    include: { organization: true },
  });

  if (membership) {
    return { organization: membership.organization, role: membership.role };
  }

  const organization = await prisma.organization.upsert({
    where: { ownerAuthUserId: authUserId },
    update: {},
    create: { ownerAuthUserId: authUserId, name: defaultName },
  });

  await prisma.membership.upsert({
    where: { authUserId },
    update: {},
    create: {
      organizationId: organization.id,
      authUserId,
      email: defaultName,
      role: "OWNER",
    },
  });

  return { organization, role: "OWNER" as const };
}
