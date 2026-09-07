import { fillDocxRow } from "./fill-docx";
import { fileNameForRow } from "./types";
import { getWorkerSelf, type GenerateRequest } from "./worker-protocol";

const worker = getWorkerSelf();

addEventListener("message", (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;
  const usedNames = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const bytes = fillDocxRow(templateBytes, fields, row);
      const fileName = fileNameForRow(fields, row, i, "docx", usedNames);
      worker.postMessage(
        { type: "row-done", index: i, total, fileName, bytes },
        [bytes]
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
