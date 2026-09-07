import { fillPdfRow } from "./fill-pdf";
import { fileNameForRow } from "./types";
import { getWorkerSelf, type GenerateRequest } from "./worker-protocol";

const worker = getWorkerSelf();

addEventListener("message", async (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;
  const usedNames = new Set<string>();

  const koreanFontBytes = await fetch("/fonts/noto-sans-kr-400.woff").then((r) =>
    r.arrayBuffer()
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const bytes = await fillPdfRow(templateBytes, fields, row, koreanFontBytes);
      const buffer = bytes.buffer as ArrayBuffer;
      const fileName = fileNameForRow(fields, row, i, "pdf", usedNames);
      worker.postMessage(
        { type: "row-done", index: i, total, fileName, bytes: buffer },
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
