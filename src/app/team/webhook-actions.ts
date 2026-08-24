"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, canManageMembers } from "@/lib/membership";
import { dispatchTestEvent } from "@/lib/webhooks";

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

export async function createWebhook(formData: FormData) {
  const membership = await requireOwner();
  if (!membership) redirect("/team");

  const url = String(formData.get("url") ?? "").trim();
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    redirect("/team");
  }

  await prisma.webhook.create({
    data: {
      organizationId: membership.organizationId,
      url,
      secret: randomBytes(24).toString("hex"),
    },
  });

  redirect("/team");
}

export async function deleteWebhook(webhookId: string) {
  const membership = await requireOwner();
  if (!membership) return;

  await prisma.webhook.deleteMany({
    where: { id: webhookId, organizationId: membership.organizationId },
  });

  redirect("/team");
}

export async function toggleWebhook(webhookId: string, active: boolean) {
  const membership = await requireOwner();
  if (!membership) return;

  await prisma.webhook.updateMany({
    where: { id: webhookId, organizationId: membership.organizationId },
    data: { active },
  });

  redirect("/team");
}

export async function sendTestWebhook(webhookId: string) {
  const membership = await requireOwner();
  if (!membership) return;

  await dispatchTestEvent(webhookId, membership.organizationId);

  redirect("/team");
}
