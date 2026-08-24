"use server";

import { redirect } from "next/navigation";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/organization";
import { canManageTemplates } from "@/lib/membership";
import { extractDocxFieldKeys, extractXlsxFieldKeys, prettifyFieldLabel } from "@/lib/template-tags";
import { prisma } from "@/lib/prisma";
import type { TemplateFileType } from "@/generated/prisma/client";

export type UploadFormState = { error: string } | undefined;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// 업로드하는 브라우저/OS에 따라 mime type이 application/octet-stream으로만 잡히는
// 경우가 있어서, 확장자도 같이 봐서 판단한다.
function detectFileType(file: File): TemplateFileType | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (file.type === DOCX_MIME || name.endsWith(".docx")) return "DOCX";
  if (file.type === XLSX_MIME || name.endsWith(".xlsx")) return "XLSX";
  return null;
}

const CONTENT_TYPE: Record<TemplateFileType, string> = {
  PDF: "application/pdf",
  DOCX: DOCX_MIME,
  XLSX: XLSX_MIME,
};

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
    return { error: "파일을 선택해주세요." };
  }

  const fileType = detectFileType(file);
  if (!fileType) {
    return { error: "PDF, Word(.docx), Excel(.xlsx) 파일만 업로드할 수 있습니다." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "파일 크기는 10MB를 넘을 수 없습니다." };
  }

  const bytes = await file.arrayBuffer();

  let pageCount = 1;
  // DOCX/XLSX는 좌표 클릭 매핑이 없다 — 문서 안에 이미 써둔 {태그}를 찾아서
  // 그대로 필드로 만든다. 매핑 스튜디오 단계 자체가 "필드 확인/이름 정리"로 바뀐다.
  let detectedKeys: string[] = [];

  if (fileType === "PDF") {
    try {
      pageCount = (await PDFDocument.load(bytes)).getPageCount();
    } catch {
      return { error: "PDF 파일을 읽을 수 없습니다. 손상되었거나 지원하지 않는 형식입니다." };
    }
  } else if (fileType === "DOCX") {
    try {
      detectedKeys = extractDocxFieldKeys(bytes);
    } catch {
      return { error: "Word 파일을 읽을 수 없습니다. 손상되었거나 지원하지 않는 형식입니다." };
    }
    if (detectedKeys.length === 0) {
      return {
        error:
          "문서에서 {필드명} 형식의 태그를 찾지 못했습니다. Word에서 값이 들어갈 자리에 예를 들어 {invoice_no} 처럼 입력한 뒤 다시 업로드해주세요.",
      };
    }
  } else {
    try {
      detectedKeys = await extractXlsxFieldKeys(bytes);
    } catch {
      return { error: "Excel 파일을 읽을 수 없습니다. 손상되었거나 지원하지 않는 형식입니다." };
    }
    if (detectedKeys.length === 0) {
      return {
        error:
          "시트에서 {필드명} 형식의 태그를 찾지 못했습니다. 값이 들어갈 셀에 예를 들어 {invoice_no} 처럼 입력한 뒤 다시 업로드해주세요.",
      };
    }
  }

  const { organization, role } = await ensureOrganization(user.id, user.email ?? user.id);

  if (!canManageTemplates(role)) {
    return { error: "이 조직에서는 관리자만 템플릿을 만들 수 있습니다." };
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  // storage.objects RLS가 폴더 첫 세그먼트를 auth.uid()로 강제한다 (supabase/storage-setup.sql).
  const path = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("templates")
    .upload(path, bytes, { contentType: CONTENT_TYPE[fileType] });

  if (uploadError) {
    return { error: "업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  const template = await prisma.template.create({
    data: {
      organizationId: organization.id,
      name,
      fileType,
      pageCount,
      // 버킷이 비공개라 공개 URL이 아니라 오브젝트 경로를 저장한다.
      // 화면에 보여줄 때는 createSignedUrl()로 매번 서명해서 써야 한다.
      sourceFileUrl: path,
      fields: {
        create: detectedKeys.map((key) => ({
          key,
          label: prettifyFieldLabel(key),
        })),
      },
    },
  });

  redirect(`/templates/${template.id}/mapping`);
}
