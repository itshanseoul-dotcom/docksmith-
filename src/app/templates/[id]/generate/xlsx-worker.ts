import ExcelJS from "exceljs";
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

const worker = self as unknown as WorkerLike;

const TAG_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

addEventListener("message", async (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;
  // fields는 CSV 매칭용으로만 필요하고, 실제 치환은 셀 텍스트에 남아있는 모든
  // {태그}를 훑어서 처리한다 — 업로드 시 감지한 것과 매핑 저장 후의 필드가 어긋나도
  // 셀에 남은 태그 자체가 기준이 되므로 안전하다.
  void fields;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBytes);

      workbook.eachSheet((sheet) => {
        sheet.eachRow((sheetRow) => {
          sheetRow.eachCell((cell) => {
            if (typeof cell.value !== "string" || !cell.value.includes("{")) return;
            cell.value = cell.value.replace(TAG_PATTERN, (_match, key: string) => row[key] ?? "");
          });
        });
      });

      const bytes = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
      worker.postMessage(
        { type: "row-done", index: i, total, fileName: `row-${i + 1}.xlsx`, bytes },
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
