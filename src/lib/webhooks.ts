import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

interface GenerationCompletedPayload {
  event: "generation.completed";
  data: {
    templateId: string;
    templateName: string;
    rowCount: number;
    successCount: number;
    source: "browser" | "api";
    occurredAt: string;
  };
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

// 큐 없이 요청 안에서 바로 쏘고 끝낸다 — 실패해도 재시도하지 않는다(재시도까지
// 하려면 Redis/큐가 필요해서 유지비가 든다). 응답을 기다리다 생성 흐름이 느려지지
// 않도록 타임아웃을 짧게 두고, 실패는 lastStatus에만 남기고 절대 throw하지 않는다.
async function send(webhook: { id: string; url: string; secret: string }, body: string) {
  let status: number | null = null;
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Docksmith-Signature": `sha256=${sign(webhook.secret, body)}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
    status = res.status;
  } catch {
    status = null;
  }

  await prisma.webhook
    .update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date(), lastStatus: status },
    })
    .catch(() => {});
}

export async function dispatchGenerationCompleted(
  organizationId: string,
  data: Omit<GenerationCompletedPayload["data"], "occurredAt">
) {
  const webhooks = await prisma.webhook.findMany({
    where: { organizationId, active: true },
  });
  if (webhooks.length === 0) return;

  const payload: GenerationCompletedPayload = {
    event: "generation.completed",
    data: { ...data, occurredAt: new Date().toISOString() },
  };
  const body = JSON.stringify(payload);

  await Promise.all(webhooks.map((webhook) => send(webhook, body)));
}

export async function dispatchTestEvent(webhookId: string, organizationId: string) {
  const webhook = await prisma.webhook.findFirst({
    where: { id: webhookId, organizationId },
  });
  if (!webhook) return;

  const body = JSON.stringify({
    event: "webhook.test",
    data: { message: "Docksmith 웹훅 테스트 이벤트입니다.", occurredAt: new Date().toISOString() },
  });

  await send(webhook, body);
}
