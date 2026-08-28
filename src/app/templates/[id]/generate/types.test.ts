import { describe, expect, it } from "vitest";
import { resolveFieldValue, type FieldSpec } from "./types";

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
