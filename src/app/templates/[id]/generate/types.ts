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
