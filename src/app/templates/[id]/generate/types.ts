export interface FieldSpec {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "CURRENCY";
  page: number;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  fontSize: number;
  fixedValue: string | null;
}

// 고정값이 있는 필드는 항상 CSV/요청으로 받은 값보다 우선한다 — 브라우저 플로우와
// 공개 API 둘 다 이 규칙을 똑같이 적용해야 한다.
export function resolveFieldValue(field: FieldSpec, suppliedValue: string | undefined): string {
  return field.fixedValue ?? suppliedValue ?? "";
}
