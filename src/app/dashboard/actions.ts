"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/organization";
import { prisma } from "@/lib/prisma";

// ROADMAP 2.4 — 자기 파일 없이도 샘플로 3초 안에 결과를 보게 한다. 실제 업로드 흐름과
// 똑같이 Storage에 올리고 Template/TemplateField를 만들지만, 필드는 이미 매핑된
// 상태로 만들어서 매핑 스튜디오 단계를 건너뛰고 바로 CSV 업로드 화면으로 보낸다.
const SAMPLE_FIELDS = [
  { key: "invoice_no", label: "Invoice No", type: "TEXT" as const, x: 200, y: 665, width: 150, height: 20, fontSize: 11 },
  { key: "invoice_date", label: "Invoice Date", type: "DATE" as const, x: 200, y: 635, width: 150, height: 20, fontSize: 11 },
  { key: "consignee", label: "Consignee", type: "TEXT" as const, x: 200, y: 605, width: 300, height: 20, fontSize: 11 },
  { key: "description", label: "Description", type: "TEXT" as const, x: 200, y: 575, width: 300, height: 20, fontSize: 11 },
  { key: "quantity", label: "Quantity", type: "NUMBER" as const, x: 200, y: 545, width: 100, height: 20, fontSize: 11 },
  { key: "amount", label: "Amount", type: "CURRENCY" as const, x: 200, y: 515, width: 150, height: 20, fontSize: 11 },
];

export async function createSampleTemplate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const organization = await ensureOrganization(user.id, user.email ?? user.id);

  const pdfBytes = await readFile(
    path.join(process.cwd(), "public/samples/sample-commercial-invoice.pdf")
  );

  const storagePath = `${user.id}/${crypto.randomUUID()}-sample-commercial-invoice.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("templates")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf" });

  if (uploadError) {
    redirect("/dashboard?sampleError=1");
  }

  const template = await prisma.template.create({
    data: {
      organizationId: organization.id,
      name: "샘플 — Commercial Invoice",
      pageCount: 1,
      sourceFileUrl: storagePath,
      fields: { create: SAMPLE_FIELDS.map((f) => ({ ...f, page: 1 })) },
    },
  });

  redirect(`/templates/${template.id}/generate`);
}
