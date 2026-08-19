"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { autoMatchColumns, type AliasEntry } from "./matching";
import type { FieldSpec } from "./types";
import type { GenerateRequest, GenerateResponse } from "./pdf-worker";
import { recordGenerationJob } from "./generation-actions";

interface CsvMatcherProps {
  templateId: string;
  templateName: string;
  pdfUrl: string;
  fields: FieldSpec[];
  aliases: AliasEntry[];
  usedThisMonth: number;
  monthlyLimit: number;
}

interface GenerationProgress {
  completed: number;
  total: number;
  failed: number;
}

export function CsvMatcher({
  templateId,
  templateName,
  pdfUrl,
  fields,
  aliases,
  usedThisMonth,
  monthlyLimit,
}: CsvMatcherProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [, startRecording] = useTransition();
  const workerRef = useRef<Worker | null>(null);

  const remaining = Math.max(0, monthlyLimit - usedThisMonth);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setGenError(null);
    setFileName(file.name);

    // CSV는 브라우저 밖으로 절대 안 나간다 — 이 파일 안에 실제 수취인 정보/금액이
    // 들어있을 수 있어서, 딕셔너리 매칭과 PDF 생성 모두 클라이언트에서만 처리한다.
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
        setCsvRows(dataRows);
        setMapping(autoMatchColumns(fields, aliases, header));
      },
      error: (err) => {
        setParseError(`CSV를 읽을 수 없습니다: ${err.message}`);
      },
    });
  }

  const matchedCount = Object.values(mapping).filter((v) => v !== null).length;
  const isGenerating = progress !== null && progress.completed < progress.total;
  const exceedsQuota = csvRows.length > remaining;

  function handleGenerateClick() {
    if (exceedsQuota) {
      setShowLimitModal(true);
      return;
    }
    handleGenerate();
  }

  async function handleGenerate() {
    if (!headers || csvRows.length === 0) return;
    setGenError(null);
    setProgress({ completed: 0, total: csvRows.length, failed: 0 });

    let templateBytes: ArrayBuffer;
    try {
      const res = await fetch(pdfUrl);
      templateBytes = await res.arrayBuffer();
    } catch {
      setGenError("템플릿 PDF를 불러오지 못했습니다.");
      setProgress(null);
      return;
    }

    const mappedRows: Record<string, string>[] = csvRows.map((row) => {
      const record: Record<string, string> = {};
      for (const field of fields) {
        const colIndex = mapping[field.key];
        record[field.key] = colIndex !== null && colIndex !== undefined ? row[colIndex] ?? "" : "";
      }
      return record;
    });

    const zip = new JSZip();
    let successCount = 0;

    const worker = new Worker(new URL("./pdf-worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<GenerateResponse>) => {
      const msg = event.data;
      if (msg.type === "row-done") {
        zip.file(msg.fileName, msg.bytes);
        successCount++;
        setProgress({ completed: msg.index + 1, total: msg.total, failed: 0 });
      } else if (msg.type === "row-error") {
        setProgress((prev) => ({
          completed: msg.index + 1,
          total: msg.total,
          failed: (prev?.failed ?? 0) + 1,
        }));
      } else if (msg.type === "done") {
        worker.terminate();
        workerRef.current = null;
        finishGeneration(zip, successCount, csvRows.length);
      }
    };

    worker.onerror = () => {
      setGenError("PDF 생성 중 오류가 발생했습니다.");
      worker.terminate();
      workerRef.current = null;
      setProgress(null);
    };

    const request: GenerateRequest = { templateBytes, fields, rows: mappedRows };
    worker.postMessage(request, [templateBytes]);
  }

  async function finishGeneration(zip: JSZip, successCount: number, rowCount: number) {
    if (successCount > 0) {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${templateName}-results.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }

    startRecording(() => {
      recordGenerationJob(templateId, {
        sourceFileName: fileName ?? "unknown.csv",
        rowCount,
        successCount,
      });
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold">{templateName} — 데이터 업로드</h1>
        <p className="text-sm text-muted-foreground">
          CSV를 올리면 컬럼을 필드에 자동으로 맞춰봅니다. 안 맞은 건 직접 골라주세요.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          이번 달 생성: {usedThisMonth}/{monthlyLimit}건 (무료)
        </p>
      </div>

      <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />

      {parseError && <p className="text-sm text-destructive">{parseError}</p>}

      {headers && (
        <>
          <p className="text-sm text-muted-foreground">
            {fileName} · {csvRows.length}개 행 감지됨 · {matchedCount}/{fields.length}개 필드
            자동 매칭
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

          <div className="flex flex-col gap-2">
            {exceedsQuota && (
              <p className="text-sm text-destructive">
                이번 달 남은 무료 생성 건수({remaining}건)보다 CSV 행 수({csvRows.length}건)가
                많습니다.
              </p>
            )}
            <Button type="button" onClick={handleGenerateClick} disabled={isGenerating}>
              {isGenerating ? "생성 중..." : "PDF 일괄 생성"}
            </Button>

            {progress && (
              <div className="flex flex-col gap-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress.completed} / {progress.total}건 처리
                  {progress.failed > 0 && ` · 실패 ${progress.failed}건`}
                  {!isGenerating && " · 완료, ZIP 다운로드됨"}
                </p>
              </div>
            )}

            {genError && <p className="text-sm text-destructive">{genError}</p>}
          </div>
        </>
      )}

      {showLimitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setShowLimitModal(false)}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-3 rounded-lg bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold">무료 한도를 넘었습니다</h2>
            <p className="text-sm text-muted-foreground">
              이번 달 무료로 생성할 수 있는 건수는 {monthlyLimit}건이고, 이미{" "}
              {usedThisMonth}건을 사용해서 남은 건수는 {remaining}건입니다. 이 CSV는{" "}
              {csvRows.length}건이라 한도를 넘습니다.
            </p>
            <Button type="button" disabled title="Beta 2.2(Stripe 연동)에서 연결됩니다">
              업그레이드
            </Button>
            <button
              type="button"
              onClick={() => setShowLimitModal(false)}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
