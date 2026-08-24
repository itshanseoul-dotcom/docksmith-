import "server-only";
import { prisma } from "@/lib/prisma";
import type { MembershipRole } from "@/generated/prisma/client";

export function getMembershipForUser(authUserId: string) {
  return prisma.membership.findUnique({ where: { authUserId } });
}

// OWNER/ADMIN은 템플릿을 만들고 매핑을 고칠 수 있다. MEMBER는 이미 만들어진
// 템플릿으로 CSV를 올려 생성만 할 수 있다(ROADMAP V1 — "여러 명이 같은 템플릿 공유").
export function canManageTemplates(role: MembershipRole) {
  return role === "OWNER" || role === "ADMIN";
}

// 멤버 초대/제거는 OWNER만 — 역할 체계를 단순하게 유지한다.
export function canManageMembers(role: MembershipRole) {
  return role === "OWNER";
}

// 초대를 수락하면 Membership.authUserId가 새 org로 옮겨간다(1인 1org). 지금 어떤
// org의 유일한 OWNER인데 그걸 모르고 다른 org 초대를 눌러버리면, 원래 org는 소유자가
// 하나도 남지 않아 아무도 관리(초대/멤버 제거/API 키/웹훅)할 수 없게 된다 — 그래서
// 이 경우에만 수락 전에 명시적 확인을 한 번 더 받는다.
export async function isSoleOwnerOfOtherOrg(
  membership: { id: string; organizationId: string; role: MembershipRole } | null,
  otherOrganizationId: string
): Promise<boolean> {
  if (!membership || membership.role !== "OWNER") return false;
  if (membership.organizationId === otherOrganizationId) return false;

  const otherOwnerCount = await prisma.membership.count({
    where: {
      organizationId: membership.organizationId,
      role: "OWNER",
      NOT: { id: membership.id },
    },
  });

  return otherOwnerCount === 0;
}

export async function getTemplateWithRole(templateId: string, authUserId: string) {
  const membership = await getMembershipForUser(authUserId);
  if (!membership) return null;

  const template = await prisma.template.findFirst({
    where: { id: templateId, organizationId: membership.organizationId },
  });
  if (!template) return null;

  return { template, role: membership.role, organizationId: membership.organizationId };
}
