import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { FieldSpec } from "./types";

// pdf-lib 표준 폰트(WinAnsi)는 Latin-1 밖의 문자(한글 등)를 못 그린다. 한글이 실제로
// 필요한 값에만 fontkit 기반 한글 폰트를 쓴다 — 이 폰트는 매번 새로 subset해야 해서
// 값 하나당 0.5~1초 이상 걸리는 반면, 표준 폰트는 10ms 안팎이라 차이가 크다.
const NON_LATIN1 = /[^\x00-\xFF]/;

// 브라우저 Worker(pdf-worker.ts)와 서버 공개 API 라우트가 둘 다 이 함수를 쓴다 —
// 한글 폰트 바이트는 로딩 방식(fetch vs 파일시스템)이 환경마다 달라서 인자로 받는다.
export async function fillPdfRow(
  templateBytes: ArrayBuffer,
  fields: FieldSpec[],
  row: Record<string, string>,
  koreanFontBytes: ArrayBuffer
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);
  const latinFont = await doc.embedFont(StandardFonts.Helvetica);

  const needsKorean = fields.some((f) => NON_LATIN1.test(row[f.key] ?? ""));
  const koreanFont = needsKorean ? await doc.embedFont(koreanFontBytes, { subset: true }) : null;

  const pages = doc.getPages();

  for (const field of fields) {
    const value = row[field.key];
    if (!value) continue;
    const page = pages[field.page - 1];
    if (!page) continue;
    if (field.x == null || field.y == null || field.width == null || field.height == null) {
      continue;
    }

    // 원본 템플릿이 실제 fillable PDF(예: FedEx 공식 양식)인 경우 필드 자리에
    // 회색 배경이 깔려있을 수 있다 — 값을 쓰기 전에 흰 배경을 먼저 덮어서
    // 완성본이 "채워야 할 서류" 느낌이 아니라 깨끗한 최종 문서로 보이게 한다.
    page.drawRectangle({
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      color: rgb(1, 1, 1),
    });

    const font = NON_LATIN1.test(value) ? koreanFont ?? latinFont : latinFont;

    // y는 필드 박스의 아래쪽 변(매핑 스튜디오와 동일한 좌표계) — 세로 중앙에
    // 오도록 baseline을 약간 올려서 박스 안에 자연스럽게 앉힌다.
    const baselineY = field.y + Math.max(0, (field.height - field.fontSize) / 2);
    page.drawText(value, { x: field.x, y: baselineY, size: field.fontSize, font });
  }

  return (await doc.save()).slice();
}
