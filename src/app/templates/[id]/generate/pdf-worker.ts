import { fillPdfRow } from "./fill-pdf";
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

  const koreanFontBytes = await fetch("/fonts/noto-sans-kr-400.woff").then((r) =>
    r.arrayBuffer()
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const bytes = await fillPdfRow(templateBytes, fields, row, koreanFontBytes);
      const buffer = bytes.buffer as ArrayBuffer;
      worker.postMessage(
        { type: "row-done", index: i, total, fileName: `row-${i + 1}.pdf`, bytes: buffer },
        [buffer]
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
