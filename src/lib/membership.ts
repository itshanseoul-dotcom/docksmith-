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

export async function getTemplateWithRole(templateId: string, authUserId: string) {
  const membership = await getMembershipForUser(authUserId);
  if (!membership) return null;

  const template = await prisma.template.findFirst({
    where: { id: templateId, organizationId: membership.organizationId },
  });
  if (!template) return null;

  return { template, role: membership.role, organizationId: membership.organizationId };
}
