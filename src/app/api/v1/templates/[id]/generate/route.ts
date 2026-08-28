import { NextRequest, NextResponse, after } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { resolveApiKey } from "@/lib/api-key";
import { createServiceClient } from "@/lib/supabase/service";
import { getMonthlyUsage, MONTHLY_FREE_LIMIT } from "@/lib/usage";
import { dispatchGenerationCompleted } from "@/lib/webhooks";
import { logError } from "@/lib/error-log";
import { fillPdfRow } from "@/app/templates/[id]/generate/fill-pdf";
import { fillDocxRow } from "@/app/templates/[id]/generate/fill-docx";
import { fillXlsxRow } from "@/app/templates/[id]/generate/fill-xlsx";
import { resolveFieldValue, type FieldSpec } from "@/app/templates/[id]/generate/types";

export const runtime = "nodejs";

// 큐/Redis 없이 하나의 요청 안에서 동기로 끝낸다 — 그래서 한 번에 처리할 행 수를
// 작게 잡아서 서버리스 함수 실행 시간 제한 안에 항상 끝나게 한다. 더 큰 배치는
// 브라우저 플로우(CSV 업로드)를 쓰면 된다.
const MAX_ROWS_PER_REQUEST = 25;

// 폰트 파일은 배포 후 바뀌지 않는 정적 자산이라, 웜 인스턴스 동안은 한 번만 읽으면
// 된다 — 매 요청마다 디스크에서 다시 읽는 건 낭비다.
let cachedKoreanFontBytes: ArrayBuffer | null = null;

async function loadKoreanFontBytes(): Promise<ArrayBuffer> {
  if (!cachedKoreanFontBytes) {
    const fontPath = path.join(process.cwd(), "public/fonts/noto-sans-kr-400.woff");
    const buffer = await readFile(fontPath);
    cachedKoreanFontBytes = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
  }
  return cachedKoreanFontBytes;
}

// 이 안의 모든 "예상 가능한" 실패(잘못된 키, 없는 템플릿, 잘못된 요청 본문 등)는
// 이미 각자 try/catch로 구조화된 에러 응답을 준다. 바깥의 POST()는 그 외에 정말
// 예상 못 한 버그가 새 나갔을 때만 잡아서 기록하는 안전망이다.
async function handlePost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const apiKey = await resolveApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "invalid or missing API key" }, { status: 401 });
  }

  // 둘 다 apiKey.organizationId만 있으면 되는 독립적인 조회라 병렬로 보낸다 —
  // 템플릿이 없는 요청에서는 usedThisMonth 조회가 그냥 버려지지만, 유효한 요청이
  // 훨씬 많을 거라 왕복 한 번을 아끼는 쪽이 이득이다.
  const [template, usedThisMonth] = await Promise.all([
    prisma.template.findFirst({
      where: { id, organizationId: apiKey.organizationId },
      include: { fields: true },
    }),
    getMonthlyUsage(apiKey.organizationId),
  ]);
  if (!template) {
    return NextResponse.json({ error: "template not found" }, { status: 404 });
  }

  let body: { rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array of objects" }, {
      status: 400,
    });
  }
  if (body.rows.length > MAX_ROWS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `한 번에 최대 ${MAX_ROWS_PER_REQUEST}행까지 처리할 수 있습니다. 여러 번 나눠서 호출해주세요.`,
      },
      { status: 400 }
    );
  }
  const rows = body.rows as Record<string, string>[];

  const remaining = Math.max(0, MONTHLY_FREE_LIMIT - usedThisMonth);
  if (rows.length > remaining) {
    return NextResponse.json(
      {
        error: `이번 달 남은 무료 생성 건수(${remaining}건)보다 요청한 행 수(${rows.length}건)가 많습니다.`,
      },
      { status: 402 }
    );
  }

  let templateBytes: ArrayBuffer;
  try {
    const supabase = createServiceClient();
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("templates")
      .download(template.sourceFileUrl);

    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: "템플릿 파일을 불러오지 못했습니다." }, { status: 500 });
    }
    templateBytes = await fileBlob.arrayBuffer();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "템플릿 파일을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  const fields: FieldSpec[] = template.fields.map((f) => ({
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
  }));

  const mappedRows = rows.map((row) => {
    const record: Record<string, string> = {};
    for (const field of fields) {
      record[field.key] = resolveFieldValue(field, row[field.key]);
    }
    return record;
  });

  const koreanFontBytes = template.fileType === "PDF" ? await loadKoreanFontBytes() : null;

  const zip = new JSZip();
  let successCount = 0;
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < mappedRows.length; i++) {
    const row = mappedRows[i];
    try {
      if (template.fileType === "PDF") {
        const bytes = await fillPdfRow(templateBytes, fields, row, koreanFontBytes!);
        zip.file(`row-${i + 1}.pdf`, bytes);
      } else if (template.fileType === "DOCX") {
        const bytes = fillDocxRow(templateBytes, fields, row);
        zip.file(`row-${i + 1}.docx`, bytes);
      } else {
        const bytes = await fillXlsxRow(templateBytes, row);
        zip.file(`row-${i + 1}.xlsx`, bytes);
      }
      successCount++;
    } catch (err) {
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : "알 수 없는 오류",
      });
    }
  }

  // 응답(zip 또는 에러)이 나가는 데 필요 없는 뒷정리라서 응답 이후로 미룬다.
  after(async () => {
    await prisma.generationJob.create({
      data: {
        templateId: template.id,
        sourceFileName: "API",
        rowCount: rows.length,
        status: successCount > 0 ? "COMPLETED" : "FAILED",
      },
    });

    await dispatchGenerationCompleted(apiKey.organizationId, {
      templateId: template.id,
      templateName: template.name,
      rowCount: rows.length,
      successCount,
      source: "api",
    });
  });

  if (successCount === 0) {
    return NextResponse.json(
      { error: "모든 행 생성에 실패했습니다.", details: errors },
      { status: 500 }
    );
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const responseBody = zipBytes.buffer.slice(
    zipBytes.byteOffset,
    zipBytes.byteOffset + zipBytes.byteLength
  ) as ArrayBuffer;

  return new NextResponse(responseBody, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${template.name}-results.zip"`,
      "X-Generation-Errors": String(errors.length),
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handlePost(request, context);
  } catch (err) {
    await logError({
      source: "server",
      message: err instanceof Error ? err.message : "unexpected error in generate route",
      stack: err instanceof Error ? (err.stack ?? null) : null,
      url: request.url,
    });
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
