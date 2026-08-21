import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MappingStudioLoader } from "./mapping-studio-loader";

export default async function TemplateMappingPage({
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

  const { data: signed, error } = await supabase.storage
    .from("templates")
    .createSignedUrl(template.sourceFileUrl, 60 * 10);

  if (error || !signed) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MappingStudioLoader
        templateId={template.id}
        templateName={template.name}
        pdfUrl={signed.signedUrl}
        initialFields={template.fields.map((f) => ({
          id: f.id,
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
      />
    </div>
  );
}
