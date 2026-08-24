import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser } from "@/lib/membership";
import { getMonthlyUsage, MONTHLY_FREE_LIMIT } from "@/lib/usage";
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

  const membership = await getMembershipForUser(user.id);
  if (!membership) {
    redirect("/dashboard");
  }

  const template = await prisma.template.findFirst({
    where: { id, organizationId: membership.organizationId },
    include: { fields: true },
  });

  if (!template) {
    notFound();
  }

  const { data: signed, error } = await supabase.storage
    .from("templates")
    .createSignedUrl(template.sourceFileUrl, 60 * 10);

  if (error || !signed) {
    notFound();
  }

  const aliases = await prisma.columnAlias.findMany();
  const usedThisMonth = await getMonthlyUsage(template.organizationId);

  return (
    <div className="flex flex-1 flex-col">
      <CsvMatcher
        templateId={template.id}
        templateName={template.name}
        pdfUrl={signed.signedUrl}
        fields={template.fields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          fontSize: f.fontSize,
          fixedValue: f.fixedValue,
        }))}
        aliases={aliases}
        usedThisMonth={usedThisMonth}
        monthlyLimit={MONTHLY_FREE_LIMIT}
      />
    </div>
  );
}
