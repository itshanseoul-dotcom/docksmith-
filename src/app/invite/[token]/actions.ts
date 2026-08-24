"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function acceptInvite(token: string) {
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
