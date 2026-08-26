"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwnerMembership } from "@/lib/membership";
import { generateApiKey } from "@/lib/api-key";

export type CreateApiKeyState = { error: string } | { plaintext: string; name: string } | undefined;

export async function createApiKey(
  _state: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  const membership = await requireOwnerMembership();
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
  const membership = await requireOwnerMembership();
  if (!membership) return;

  await prisma.apiKey.updateMany({
    where: { id: apiKeyId, organizationId: membership.organizationId },
    data: { revokedAt: new Date() },
  });

  redirect("/team");
}
