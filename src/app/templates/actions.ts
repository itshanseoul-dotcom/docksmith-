"use server";

import { redirect } from "next/navigation";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/organization";
import { prisma } from "@/lib/prisma";

export type UploadFormState = { error: string } | undefined;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function uploadTemplate(
  _state: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "템플릿 이름을 입력해주세요." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "PDF 파일을 선택해주세요." };
  }
  if (file.type !== "application/pdf") {
    return { error: "PDF 파일만 업로드할 수 있습니다." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "파일 크기는 10MB를 넘을 수 없습니다." };
  }

  const bytes = await file.arrayBuffer();

  let pageCount: number;
  try {
    pageCount = (await PDFDocument.load(bytes)).getPageCount();
  } catch {
    return { error: "PDF 파일을 읽을 수 없습니다. 손상되었거나 지원하지 않는 형식입니다." };
  }

  const organization = await ensureOrganization(user.id, user.email ?? user.id);

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  // storage.objects RLS가 폴더 첫 세그먼트를 auth.uid()로 강제한다 (supabase/storage-setup.sql).
  const path = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("templates")
    .upload(path, bytes, { contentType: "application/pdf" });

  if (uploadError) {
    return { error: "업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  const template = await prisma.template.create({
    data: {
      organizationId: organization.id,
      name,
      pageCount,
      // 버킷이 비공개라 공개 URL이 아니라 오브젝트 경로를 저장한다.
      // 화면에 보여줄 때는 createSignedUrl()로 매번 서명해서 써야 한다.
      sourceFileUrl: path,
    },
  });

  redirect(`/templates/${template.id}/mapping`);
}
