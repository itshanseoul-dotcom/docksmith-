import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, canManageTemplates } from "@/lib/membership";
import { MappingStudioLoader } from "./mapping-studio-loader";
import { TagFieldEditor } from "./tag-field-editor";

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

  if (!canManageTemplates(membership.role)) {
    redirect(`/templates/${id}/generate`);
  }

  if (template.fileType !== "PDF") {
    return (
      <TagFieldEditor
        templateId={template.id}
        templateName={template.name}
        fileType={template.fileType}
        initialFields={template.fields.map((f) => ({
          id: f.id,
          key: f.key,
          label: f.label,
          type: f.type,
          fixedValue: f.fixedValue,
        }))}
      />
    );
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
          x: f.x ?? 0,
          y: f.y ?? 0,
          width: f.width ?? 0,
          height: f.height ?? 0,
          fontSize: f.fontSize,
          fixedValue: f.fixedValue,
        }))}
      />
    </div>
  );
}
