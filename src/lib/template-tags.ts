import "server-only";
import Docxtemplater from "docxtemplater";
// 타입 선언은 InspectModule을 클래스로 잘못 기술하고 있다 — 실제로는
// `module.exports = function () { return new InspectModule(); }`라서 new 없이
// 호출해야 한다(node_modules/docxtemplater/js/inspect-module.js에서 직접 확인).
import createInspectModuleRaw from "docxtemplater/js/inspect-module.js";
import PizZip from "pizzip";
import ExcelJS from "exceljs";

const createInspectModule = createInspectModuleRaw as unknown as () => {
  getAllTags(): Record<string, unknown>;
};

const TAG_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

// {태그} 형식으로 이미 문서에 박아둔 필드명을 찾아낸다. 좌표 클릭 매핑이 필요 없는
// 대신, 사용자가 Word/Excel에서 직접 {invoice_no} 같은 텍스트를 입력해둬야 한다.
export function extractDocxFieldKeys(bytes: ArrayBuffer): string[] {
  const zip = new PizZip(bytes);
  const inspectModule = createInspectModule();
  new Docxtemplater(zip, { modules: [inspectModule as unknown as Docxtemplater.DXT.Module] });
  return Object.keys(inspectModule.getAllTags());
}

export async function extractXlsxFieldKeys(bytes: ArrayBuffer): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  const keys = new Set<string>();
  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value !== "string") return;
        for (const match of cell.value.matchAll(TAG_PATTERN)) {
          keys.add(match[1]);
        }
      });
    });
  });

  return [...keys];
}

export function prettifyFieldLabel(key: string): string {
  return key.replace(/_/g, " ");
}
