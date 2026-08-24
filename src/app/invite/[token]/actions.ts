"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, isSoleOwnerOfOtherOrg } from "@/lib/membership";

export async function acceptInvite(token: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const invite = await prisma.organizationInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) {
    redirect(`/invite/${token}`);
  }

  const membership = await getMembershipForUser(user.id);
  const risksOrphaningOwnOrg = await isSoleOwnerOfOtherOrg(membership, invite.organizationId);
  if (risksOrphaningOwnOrg && formData.get("confirmLeave") !== "on") {
    redirect(`/invite/${token}?error=confirm_required`);
  }

  await prisma.$transaction([
    prisma.membership.upsert({
      where: { authUserId: user.id },
      update: {
        organizationId: invite.organizationId,
        role: invite.role,
        email: user.email ?? user.id,
      },
      create: {
        organizationId: invite.organizationId,
        authUserId: user.id,
        role: invite.role,
        email: user.email ?? user.id,
      },
    }),
    prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  redirect("/dashboard");
}
