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
  useAsFileName: boolean;
}

// 고정값이 있는 필드는 항상 CSV/요청으로 받은 값보다 우선한다 — 브라우저 플로우와
// 공개 API 둘 다 이 규칙을 똑같이 적용해야 한다.
export function resolveFieldValue(field: FieldSpec, suppliedValue: string | undefined): string {
  return field.fixedValue ?? suppliedValue ?? "";
}

// 파일 시스템/zip 항목 이름에 쓸 수 없는 문자를 치환한다(Windows가 가장 까다로움).
function sanitizeFileNameSegment(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 100);
}

// 필드 중 하나가 "파일명으로 사용"으로 지정돼 있으면 그 값으로 파일명을 만든다
// (예: 송장번호 → INV-1001.pdf). 값이 비어있거나 지정된 필드가 없으면 기존처럼
// row-N을 쓴다. usedNames는 같은 작업(zip) 안에서 값이 중복될 때 덮어쓰지 않도록
// 호출하는 쪽에서 하나 만들어 계속 넘겨준다.
export function fileNameForRow(
  fields: FieldSpec[],
  row: Record<string, string>,
  index: number,
  extension: string,
  usedNames: Set<string>
): string {
  const fileNameField = fields.find((f) => f.useAsFileName);
  const raw = fileNameField ? row[fileNameField.key] : undefined;
  const base = raw && raw.trim() ? sanitizeFileNameSegment(raw) : `row-${index + 1}`;

  let candidate = `${base}.${extension}`;
  let n = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base}-${n++}.${extension}`;
  }
  usedNames.add(candidate);
  return candidate;
}
