import { PDFDocument } from "pdf-lib";
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

addEventListener("message", async (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;

  // pdf-lib의 표준 폰트(WinAnsi)는 한글을 못 그린다 — CSV 값에 한글 회사명/주소가
  // 섞이는 경우가 흔해서, 한/영 둘 다 되는 폰트를 매 행마다 새로 임베드한다.
  const koreanFontBytes = await fetch("/fonts/noto-sans-kr-400.woff").then((r) =>
    r.arrayBuffer()
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const doc = await PDFDocument.load(templateBytes);
      doc.registerFontkit(fontkit);
      const font = await doc.embedFont(koreanFontBytes, { subset: true });
      const pages = doc.getPages();

      for (const field of fields) {
        const value = row[field.key];
        if (!value) continue;
        const page = pages[field.page - 1];
        if (!page) continue;

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
