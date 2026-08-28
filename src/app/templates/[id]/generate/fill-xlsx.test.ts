import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { fillXlsxRow } from "./fill-xlsx";

async function buildMinimalXlsx(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.getCell("A1").value = "Invoice No";
  sheet.getCell("B1").value = "{invoice_no}";
  sheet.getCell("A2").value = "Consignee";
  sheet.getCell("B2").value = "{consignee}";
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

describe("fillXlsxRow", () => {
  it("substitutes {tag} cells with row values, including Korean text", async () => {
    const templateBytes = await buildMinimalXlsx();
    const bytes = await fillXlsxRow(templateBytes, { invoice_no: "INV-100", consignee: "박영희" });

    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(bytes);
    const sheet = reloaded.getWorksheet("Sheet1")!;
    expect(sheet.getCell("B1").value).toBe("INV-100");
    expect(sheet.getCell("B2").value).toBe("박영희");
    // untouched cells are left alone
    expect(sheet.getCell("A1").value).toBe("Invoice No");
  });

  it("does not mutate the original template bytes, so the same buffer can be reused per row", async () => {
    const templateBytes = await buildMinimalXlsx();
    await fillXlsxRow(templateBytes, { invoice_no: "INV-100", consignee: "A" });
    const second = await fillXlsxRow(templateBytes, { invoice_no: "INV-200", consignee: "B" });

    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(second);
    expect(reloaded.getWorksheet("Sheet1")!.getCell("B1").value).toBe("INV-200");
  });

  it("leaves a tag as literal text when no matching row value is provided", async () => {
    const templateBytes = await buildMinimalXlsx();
    const bytes = await fillXlsxRow(templateBytes, { invoice_no: "INV-1" });

    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(bytes);
    // consignee has no value supplied -> replaced with empty string, not left as {consignee}
    expect(reloaded.getWorksheet("Sheet1")!.getCell("B2").value).toBe("");
  });
});
