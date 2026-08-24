"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, canManageMembers } from "@/lib/membership";
import type { MembershipRole } from "@/generated/prisma/client";

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getMembershipForUser(user.id);
  if (!membership || !canManageMembers(membership.role)) {
    return null;
  }

  return membership;
}

export async function createInvite(formData: FormData) {
  const membership = await requireOwner();
  if (!membership) {
    redirect("/team");
  }

  const role = String(formData.get("role") ?? "MEMBER") as MembershipRole;
  if (role !== "ADMIN" && role !== "MEMBER") {
    redirect("/team");
  }

  await prisma.organizationInvite.create({
    data: {
      organizationId: membership.organizationId,
      role,
      token: crypto.randomUUID(),
    },
  });

  redirect("/team");
}

export async function revokeInvite(inviteId: string) {
  const membership = await requireOwner();
  if (!membership) return;

  await prisma.organizationInvite.deleteMany({
    where: { id: inviteId, organizationId: membership.organizationId },
  });

  redirect("/team");
}

export async function removeMember(membershipId: string) {
  const membership = await requireOwner();
  if (!membership) return;

  // 자기 자신은 이 버튼으로 못 나가게 막는다 — org에 소유자가 하나도 없는 상태를 방지.
  await prisma.membership.deleteMany({
    where: {
      id: membershipId,
      organizationId: membership.organizationId,
      NOT: { id: membership.id },
    },
  });

  redirect("/team");
}
