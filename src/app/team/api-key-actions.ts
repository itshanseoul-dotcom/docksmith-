"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, canManageMembers } from "@/lib/membership";
import { generateApiKey } from "@/lib/api-key";

export type CreateApiKeyState = { error: string } | { plaintext: string; name: string } | undefined;

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

export async function createApiKey(
  _state: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  const membership = await requireOwner();
  if (!membership) {
    return { error: "API 키는 소유자만 만들 수 있습니다." };
  }

  const name = String(formData.get("name") ?? "").trim() || "이름 없는 키";
  const { plaintext, keyPrefix, keyHash } = generateApiKey();

  await prisma.apiKey.create({
    data: { organizationId: membership.organizationId, name, keyPrefix, keyHash },
  });

  return { plaintext, name };
}

export async function revokeApiKey(apiKeyId: string) {
  const membership = await requireOwner();
  if (!membership) return;

  await prisma.apiKey.updateMany({
    where: { id: apiKeyId, organizationId: membership.organizationId },
    data: { revokedAt: new Date() },
  });

  redirect("/team");
}
