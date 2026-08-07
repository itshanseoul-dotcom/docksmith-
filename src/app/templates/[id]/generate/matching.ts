export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export interface FieldForMatching {
  key: string;
  label: string;
}

export interface AliasEntry {
  canonicalKey: string;
  alias: string;
}

// 필드마다 CSV 헤더 배열에서 매칭되는 컬럼의 인덱스를 찾는다. key/label과의 직접 일치를
// 먼저 보고, 그다음 딕셔너리(ColumnAlias)에 등록된 별칭과 비교한다. 컬럼 하나는 필드
// 하나에만 쓰이도록 먼저 매칭된 컬럼은 다음 필드 매칭에서 제외한다.
export function autoMatchColumns(
  fields: FieldForMatching[],
  aliases: AliasEntry[],
  csvHeaders: string[]
): Record<string, number | null> {
  const normalizedHeaders = csvHeaders.map(normalizeHeader);

  const aliasesByCanonicalKey = new Map<string, Set<string>>();
  for (const { canonicalKey, alias } of aliases) {
    const set = aliasesByCanonicalKey.get(canonicalKey) ?? new Set<string>();
    set.add(normalizeHeader(alias));
    aliasesByCanonicalKey.set(canonicalKey, set);
  }

  const usedColumns = new Set<number>();
  const result: Record<string, number | null> = {};

  for (const field of fields) {
    const candidates = new Set<string>([
      normalizeHeader(field.key),
      normalizeHeader(field.label),
      ...(aliasesByCanonicalKey.get(field.key) ?? []),
    ]);

    const matchIndex = normalizedHeaders.findIndex(
      (header, i) => !usedColumns.has(i) && candidates.has(header)
    );

    result[field.key] = matchIndex >= 0 ? matchIndex : null;
    if (matchIndex >= 0) {
      usedColumns.add(matchIndex);
    }
  }

  return result;
}
