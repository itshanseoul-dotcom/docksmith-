import "server-only";
import { prisma } from "@/lib/prisma";

interface LogErrorInput {
  source: "server" | "client";
  message: string;
  stack?: string | null;
  digest?: string | null;
  url?: string | null;
  organizationId?: string | null;
}

// Sentry 없이 자체 DB에 남기는 에러 기록 — 절대 이 함수 자체가 에러를 던지면 안 된다
// (에러를 기록하려다 또 다른 에러를 내면 원래 문제를 덮어버린다).
export async function logError(input: LogErrorInput): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        source: input.source,
        message: input.message.slice(0, 2000),
        stack: input.stack?.slice(0, 8000) ?? null,
        digest: input.digest ?? null,
        url: input.url ?? null,
        organizationId: input.organizationId ?? null,
      },
    });
  } catch {
    // DB에 못 남기면 그냥 포기한다 — 콘솔에라도 남겨서 배포 로그에서 볼 수 있게.
    console.error("[error-log] failed to persist error log:", input.message);
  }
}
