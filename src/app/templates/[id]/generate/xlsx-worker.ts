import { fillXlsxRow } from "./fill-xlsx";
import { fileNameForRow } from "./types";
import { getWorkerSelf, type GenerateRequest } from "./worker-protocol";

const worker = getWorkerSelf();

addEventListener("message", async (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;
  const usedNames = new Set<string>();
  // fields는 실제 셀 치환에는 안 쓰인다 — 셀 텍스트에 남아있는 모든 {태그}를 훑어서
  // 처리하므로, 업로드 시 감지한 것과 매핑 저장 후의 필드가 어긋나도 안전하다.
  // 파일명 지정(useAsFileName)에만 fields가 필요하다.

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const bytes = await fillXlsxRow(templateBytes, row);
      const fileName = fileNameForRow(fields, row, i, "xlsx", usedNames);
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
