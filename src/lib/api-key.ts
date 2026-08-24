import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const KEY_PREFIX = "dk_";

// 평문 키는 발급 시점에 딱 한 번만 존재한다 — 호출자가 화면에 보여준 뒤 버려야
// 하고, DB에는 keyHash(SHA-256)만 남는다. keyPrefix는 목록에서 구분용으로 보여줄
// 수 있는 일부(비밀 아님).
export function generateApiKey() {
  const secret = randomBytes(24).toString("hex");
  const plaintext = `${KEY_PREFIX}${secret}`;
  const keyPrefix = plaintext.slice(0, 12);
  const keyHash = hashApiKey(plaintext);
  return { plaintext, keyPrefix, keyHash };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export async function resolveApiKey(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const plaintext = authorizationHeader.slice("Bearer ".length).trim();
  if (!plaintext.startsWith(KEY_PREFIX)) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(plaintext) },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey;
}
