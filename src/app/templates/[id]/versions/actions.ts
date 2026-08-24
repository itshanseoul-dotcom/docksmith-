"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getTemplateWithRole, canManageTemplates } from "@/lib/membership";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldInput } from "../mapping/actions";

export async function restoreTemplateFieldVersion(templateId: string, versionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await getTemplateWithRole(templateId, user.id);
  if (!result || !canManageTemplates(result.role)) {
    redirect(`/templates/${templateId}/versions`);
  }

  const version = await prisma.templateFieldVersion.findFirst({
    where: { id: versionId, templateId },
  });

  if (!version) {
    redirect(`/templates/${templateId}/versions`);
  }

  const fields = version.fields as unknown as FieldInput[];

  await prisma.$transaction([
    prisma.templateField.deleteMany({ where: { templateId } }),
    prisma.templateField.createMany({
      data: fields.map((f) => ({ ...f, templateId })),
    }),
    prisma.templateFieldVersion.create({
      data: { templateId, fields: fields as unknown as Prisma.InputJsonValue },
    }),
  ]);

  redirect(`/templates/${templateId}/mapping`);
}
