import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import { fillDocxRow } from "./fill-docx";
import type { FieldSpec } from "./types";

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

function field(key: string): FieldSpec {
  return {
    key,
    label: key,
    type: "TEXT",
    page: 1,
    x: null,
    y: null,
    width: null,
    height: null,
    fontSize: 10,
    fixedValue: null,
  };
}

describe("fillDocxRow", () => {
  const templateBytes = buildMinimalDocx();
  const fields = [field("invoice_no"), field("consignee")];

  it("substitutes tags with row values, including Korean text", () => {
    const bytes = fillDocxRow(templateBytes, fields, {
      invoice_no: "INV-001",
      consignee: "홍길동",
    });

    const outZip = new PizZip(bytes);
    const xml = outZip.file("word/document.xml")!.asText();
    expect(xml).toContain("INV-001");
    expect(xml).toContain("홍길동");
    expect(xml).not.toContain("{invoice_no}");
    expect(xml).not.toContain("{consignee}");
  });

  it("does not mutate the original template bytes, so the same buffer can be reused per row", () => {
    fillDocxRow(templateBytes, fields, { invoice_no: "INV-001", consignee: "A" });
    const second = fillDocxRow(templateBytes, fields, { invoice_no: "INV-002", consignee: "B" });

    const outZip = new PizZip(second);
    const xml = outZip.file("word/document.xml")!.asText();
    expect(xml).toContain("INV-002");
    expect(xml).not.toContain("INV-001");
  });

  it("fills missing fields with an empty string instead of throwing", () => {
    const bytes = fillDocxRow(templateBytes, fields, { invoice_no: "INV-001" });
    const outZip = new PizZip(bytes);
    const xml = outZip.file("word/document.xml")!.asText();
    expect(xml).toContain("Invoice: INV-001");
    expect(xml).toContain("Consignee: ");
  });
});
