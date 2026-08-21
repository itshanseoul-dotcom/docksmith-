export interface FieldSpec {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "CURRENCY";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fixedValue: string | null;
}
