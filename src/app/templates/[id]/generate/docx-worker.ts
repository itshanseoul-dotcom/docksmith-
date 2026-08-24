import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
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

addEventListener("message", (event: MessageEvent<GenerateRequest>) => {
  const { templateBytes, fields, rows } = event.data;
  const total = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const zip = new PizZip(templateBytes);
      const doc = new Docxtemplater(zip, { nullGetter: () => "" });

      const data: Record<string, string> = {};
      for (const field of fields) {
        data[field.key] = row[field.key] ?? "";
      }
      doc.render(data);

      const bytes = doc.getZip().generate({ type: "arraybuffer" }) as ArrayBuffer;
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
