import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import ExcelJS from "exceljs";
import { extractDocxFieldKeys, extractXlsxFieldKeys, prettifyFieldLabel } from "./template-tags";

function buildMinimalDocx(): ArrayBuffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Invoice: {invoice_no}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Consignee: {consignee}</w:t></w:r></w:p>
  </w:body>
</w:document>`
  );
  const buf = zip.generate({ type: "nodebuffer" }) as Buffer;
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function buildMinimalXlsx(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.getCell("A1").value = "Invoice No";
  sheet.getCell("B1").value = "{invoice_no}";
  sheet.getCell("A2").value = "Consignee";
  sheet.getCell("B2").value = "{consignee}";
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

describe("extractDocxFieldKeys", () => {
  it("finds all {tag} placeholders in a docx template", () => {
    const keys = extractDocxFieldKeys(buildMinimalDocx());
    expect(keys.sort()).toEqual(["consignee", "invoice_no"]);
  });
});

describe("extractXlsxFieldKeys", () => {
  it("finds all {tag} placeholders across cells in an xlsx template", async () => {
    const keys = await extractXlsxFieldKeys(await buildMinimalXlsx());
    expect(keys.sort()).toEqual(["consignee", "invoice_no"]);
  });
});

describe("prettifyFieldLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(prettifyFieldLabel("invoice_no")).toBe("invoice no");
    expect(prettifyFieldLabel("shipper_company_name")).toBe("shipper company name");
    expect(prettifyFieldLabel("consignee")).toBe("consignee");
  });
});
