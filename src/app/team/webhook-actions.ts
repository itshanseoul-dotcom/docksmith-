"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, canManageMembers } from "@/lib/membership";
import { dispatchTestEvent } from "@/lib/webhooks";
import { isSafeWebhookUrl } from "@/lib/url-safety";

export type CreateWebhookState = { error: string } | undefined;

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

export async function createWebhook(
  _state: CreateWebhookState,
  formData: FormData
): Promise<CreateWebhookState> {
  const membership = await requireOwner();
  if (!membership) {
    return { error: "웹훅은 소유자만 만들 수 있습니다." };
  }

  const url = String(formData.get("url") ?? "").trim();

  // http(s) 여부만 보는 게 아니라, 실제로 내부 전용 주소(localhost/사설망/클라우드
  // 메타데이터 등)로 풀리지 않는지까지 확인한다 — 그 주소로는 우리 서버가 직접
  // 요청을 보내게 되기 때문이다(SSRF 방지, src/lib/url-safety.ts).
  if (!(await isSafeWebhookUrl(url))) {
    return {
      error: "외부에서 접근 가능한 http(s):// 주소만 등록할 수 있습니다 (내부/사설망 주소는 불가).",
    };
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
