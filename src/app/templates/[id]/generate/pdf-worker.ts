import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { FieldSpec } from "./types";

export interface GenerateRequest {
  templateBytes: ArrayBuffer;
  fields: FieldSpec[];
  rows: Record<string, string>[];
}

export type GenerateResponse =
  | { type: "row-done"; index: number; total: number; fileName: string; bytes: ArrayBuffer }
  | { type: "row-error"; index: number; total: number; message: string }
  | { type: "done" };

interface WorkerLike {
  postMessage(message: GenerateResponse, transfer?: Transferable[]): void;
}

// tsconfig의 lib에 "webworker"가 없어서(dom과 동시에 못 씀) self의 타입이 Window로
// 잡힌다. postMessage 시그니처가 달라서 실제로 필요한 모양만 뽑아 캐스팅해서 쓴다.
const worker = self as unknown as WorkerLike;

// pdf-lib 표준 폰트(WinAnsi)는 Latin-1 밖의 문자(한글 등)를 못 그린다. 한글이 실제로
// 필요한 값에만 fontkit 기반 한글 폰트를 쓴다 — 이 폰트는 매번 새로 subset해야 해서
// 값 하나당 0.5~1초 이상 걸리는 반면, 표준 폰트는 10ms 안팎이라 차이가 크다.
const NON_LATIN1 = /[^\x00-\xFF]/;

addEventListener("message", async (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;

  const koreanFontBytes = await fetch("/fonts/noto-sans-kr-400.woff").then((r) =>
    r.arrayBuffer()
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const doc = await PDFDocument.load(templateBytes);
      doc.registerFontkit(fontkit);
      const latinFont = await doc.embedFont(StandardFonts.Helvetica);

      const needsKorean = fields.some((f) => NON_LATIN1.test(row[f.key] ?? ""));
      const koreanFont = needsKorean
        ? await doc.embedFont(koreanFontBytes, { subset: true })
        : null;

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

      const bytes = (await doc.save()).slice();
      worker.postMessage(
        {
          type: "row-done",
          index: i,
          total,
          fileName: `row-${i + 1}.pdf`,
          bytes: bytes.buffer,
        },
        [bytes.buffer]
      );
    } catch (err) {
      worker.postMessage({
        type: "row-error",
        index: i,
        total,
        message: err instanceof Error ? err.message : "알 수 없는 오류",
      });
    }
  }

  worker.postMessage({ type: "done" });
});
