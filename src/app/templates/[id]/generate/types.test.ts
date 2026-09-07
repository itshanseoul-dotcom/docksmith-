import { describe, expect, it } from "vitest";
import { resolveFieldValue, fileNameForRow, type FieldSpec } from "./types";

function field(overrides: Partial<FieldSpec> = {}): FieldSpec {
  return {
    key: "invoice_no",
    label: "Invoice No",
    type: "TEXT",
    page: 1,
    x: null,
    y: null,
    width: null,
    height: null,
    fontSize: 10,
    fixedValue: null,
    useAsFileName: false,
    ...overrides,
  };
}

describe("resolveFieldValue", () => {
  it("uses the fixed value when set, ignoring the supplied value", () => {
    expect(resolveFieldValue(field({ fixedValue: "ACME Corp" }), "some csv value")).toBe(
      "ACME Corp"
    );
  });

  it("uses the supplied value when no fixed value is set", () => {
    expect(resolveFieldValue(field({ fixedValue: null }), "INV-001")).toBe("INV-001");
  });

  it("falls back to empty string when neither is present", () => {
    expect(resolveFieldValue(field({ fixedValue: null }), undefined)).toBe("");
  });

  it("an empty-string fixed value still wins over a supplied value", () => {
    expect(resolveFieldValue(field({ fixedValue: "" }), "some csv value")).toBe("");
  });
});

describe("fileNameForRow", () => {
  it("falls back to row-N when no field is marked useAsFileName", () => {
    const fields = [field()];
    const used = new Set<string>();
    expect(fileNameForRow(fields, { invoice_no: "INV-1001" }, 0, "pdf", used)).toBe("row-1.pdf");
  });

  it("uses the designated field's value as the file name", () => {
    const fields = [field({ useAsFileName: true })];
    const used = new Set<string>();
    expect(fileNameForRow(fields, { invoice_no: "INV-1001" }, 0, "pdf", used)).toBe(
      "INV-1001.pdf"
    );
  });

  it("falls back to row-N when the designated field's value is empty", () => {
    const fields = [field({ useAsFileName: true })];
    const used = new Set<string>();
    expect(fileNameForRow(fields, { invoice_no: "" }, 2, "pdf", used)).toBe("row-3.pdf");
  });

  it("sanitizes characters that are invalid in file names", () => {
    const fields = [field({ useAsFileName: true })];
    const used = new Set<string>();
    expect(fileNameForRow(fields, { invoice_no: 'INV/1001:"bad"' }, 0, "pdf", used)).toBe(
      "INV_1001__bad_.pdf"
    );
  });

  it("de-duplicates repeated values within the same batch", () => {
    const fields = [field({ useAsFileName: true })];
    const used = new Set<string>();
    expect(fileNameForRow(fields, { invoice_no: "INV-1001" }, 0, "pdf", used)).toBe(
      "INV-1001.pdf"
    );
    expect(fileNameForRow(fields, { invoice_no: "INV-1001" }, 1, "pdf", used)).toBe(
      "INV-1001-2.pdf"
    );
  });
});
