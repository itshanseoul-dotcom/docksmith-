"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getTemplateWithRole, canManageTemplates } from "@/lib/membership";
import type { FieldType, Prisma } from "@/generated/prisma/client";

export type SaveFieldsState = { error: string } | undefined;

export interface FieldInput {
  key: string;
  label: string;
  type: FieldType;
  page: number;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  fontSize: number;
  fixedValue: string | null;
}

export async function saveTemplateFields(
  templateId: string,
  fields: FieldInput[]
): Promise<SaveFieldsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 같은 org 소속인지 확인 — 다른 org 템플릿에 필드를 심는 걸 막는다.
  const result = await getTemplateWithRole(templateId, user.id);

  if (!result) {
    return { error: "템플릿을 찾을 수 없습니다." };
  }

  if (!canManageTemplates(result.role)) {
    return { error: "이 조직에서는 관리자만 매핑을 수정할 수 있습니다." };
  }

  if (fields.some((f) => !f.key.trim() || !f.label.trim())) {
    return { error: "모든 필드에 이름이 있어야 합니다." };
  }

  const keys = fields.map((f) => f.key);
  if (new Set(keys).size !== keys.length) {
    return { error: "필드 이름이 중복됩니다." };
  }

  await prisma.$transaction([
    prisma.templateField.deleteMany({ where: { templateId } }),
    prisma.templateField.createMany({
      data: fields.map((f) => ({ ...f, templateId })),
    }),
    prisma.templateFieldVersion.create({
      data: { templateId, fields: fields as unknown as Prisma.InputJsonValue },
    }),
  ]);

  redirect(`/templates/${templateId}/generate`);
}
