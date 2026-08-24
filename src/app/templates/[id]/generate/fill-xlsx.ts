import ExcelJS from "exceljs";

const TAG_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

export async function fillXlsxRow(
  templateBytes: ArrayBuffer,
  row: Record<string, string>
): Promise<ArrayBuffer> {
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

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}
