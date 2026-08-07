"use client";

import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { autoMatchColumns, type AliasEntry, type FieldForMatching } from "./matching";

interface CsvMatcherProps {
  templateName: string;
  fields: FieldForMatching[];
  aliases: AliasEntry[];
}

export function CsvMatcher({ templateName, fields, aliases }: CsvMatcherProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [parseError, setParseError] = useState<string | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setFileName(file.name);

    // CSV는 브라우저 밖으로 절대 안 나간다 — 이 파일 안에 실제 수취인 정보/금액이
    // 들어있을 수 있어서, 딕셔너리 매칭도 전부 클라이언트에서만 계산한다.
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          setParseError("CSV 파일에 데이터가 없습니다.");
          setHeaders(null);
          return;
        }
        const [header, ...dataRows] = rows;
        setHeaders(header);
        setRowCount(dataRows.length);
        setMapping(autoMatchColumns(fields, aliases, header));
      },
      error: (err) => {
        setParseError(`CSV를 읽을 수 없습니다: ${err.message}`);
      },
    });
  }

  const matchedCount = Object.values(mapping).filter((v) => v !== null).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold">{templateName} — 데이터 업로드</h1>
        <p className="text-sm text-muted-foreground">
          CSV를 올리면 컬럼을 필드에 자동으로 맞춰봅니다. 안 맞은 건 직접 골라주세요.
        </p>
      </div>

      <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />

      {parseError && <p className="text-sm text-destructive">{parseError}</p>}

      {headers && (
        <>
          <p className="text-sm text-muted-foreground">
            {fileName} · {rowCount}개 행 감지됨 · {matchedCount}/{fields.length}개 필드 자동
            매칭
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">필드</th>
                <th className="py-2">CSV 컬럼</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-b">
                  <td className="py-2">{field.label}</td>
                  <td className="py-2">
                    <select
                      value={mapping[field.key] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field.key]:
                            e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    >
                      <option value="">선택 안 함</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col gap-1">
            <Button type="button" disabled title="ROADMAP 1.6에서 추가됩니다">
              PDF 일괄 생성
            </Button>
            <p className="text-xs text-muted-foreground">
              실제 생성 기능은 다음 단계(1.6 클라이언트 사이드 생성 엔진)에서 연결됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
