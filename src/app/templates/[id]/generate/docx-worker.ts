import { fillDocxRow } from "./fill-docx";
import { getWorkerSelf, type GenerateRequest } from "./worker-protocol";

const worker = getWorkerSelf();

addEventListener("message", (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const bytes = fillDocxRow(templateBytes, fields, row);
      worker.postMessage(
        { type: "row-done", index: i, total, fileName: `row-${i + 1}.docx`, bytes },
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
