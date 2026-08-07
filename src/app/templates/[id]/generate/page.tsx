import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CsvMatcher } from "./csv-matcher";

export default async function GenerateTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const template = await prisma.template.findFirst({
    where: { id, organization: { ownerAuthUserId: user.id } },
    include: { fields: true },
  });

  if (!template) {
    notFound();
  }

  const aliases = await prisma.columnAlias.findMany();

  return (
    <div className="flex flex-1 flex-col">
      <CsvMatcher
        templateName={template.name}
        fields={template.fields.map((f) => ({ key: f.key, label: f.label }))}
        aliases={aliases}
      />
    </div>
  );
}
