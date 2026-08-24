import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { FieldSpec } from "./types";

export function fillDocxRow(
  templateBytes: ArrayBuffer,
  fields: FieldSpec[],
  row: Record<string, string>
): ArrayBuffer {
  const zip = new PizZip(templateBytes);
  const doc = new Docxtemplater(zip, { nullGetter: () => "" });

  const data: Record<string, string> = {};
  for (const field of fields) {
    data[field.key] = row[field.key] ?? "";
  }
  doc.render(data);

  return doc.getZip().generate({ type: "arraybuffer" }) as ArrayBuffer;
}
