"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { FieldType } from "@/generated/prisma/client";

export type SaveFieldsState = { error: string } | undefined;

export interface FieldInput {
  key: string;
  label: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
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

  // org 소유 확인 — 다른 사람 템플릿에 필드를 심는 걸 막는다.
  const template = await prisma.template.findFirst({
    where: { id: templateId, organization: { ownerAuthUserId: user.id } },
  });

  if (!template) {
    return { error: "템플릿을 찾을 수 없습니다." };
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
  ]);

  redirect(`/templates/${templateId}/generate`);
}
