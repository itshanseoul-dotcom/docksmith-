"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RecordGenerationJobInput {
  sourceFileName: string;
  rowCount: number;
  successCount: number;
}

// CSV의 실제 행 데이터는 절대 서버로 보내지 않는다 — 여기 남기는 건
// "언제 몇 건을 처리했는지" 뿐이다(ARCHITECTURE.md 5장, prisma/schema.prisma 주석).
// 그래서 GenerationJobItem(행 단위 기록)은 이 단계에서 채우지 않는다.
export async function recordGenerationJob(
  templateId: string,
  input: RecordGenerationJobInput
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const template = await prisma.template.findFirst({
    where: { id: templateId, organization: { ownerAuthUserId: user.id } },
  });

  if (!template) return;

  await prisma.generationJob.create({
    data: {
      templateId,
      sourceFileName: input.sourceFileName,
      rowCount: input.rowCount,
      status: input.successCount > 0 ? "COMPLETED" : "FAILED",
    },
  });
}
