"use client";

import { useEffect, useRef, useState, useTransition, type PointerEvent } from "react";
import Link from "next/link";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTemplateFields, type FieldInput } from "./actions";
import type { FieldType } from "@/generated/prisma/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// 이 스튜디오는 PDF 템플릿에서만 쓰인다 — x/y/width/height가 항상 채워져 있다고
// 보고(FieldInput 전체에서는 DOCX/XLSX 때문에 null 허용) 여기서는 좁혀서 쓴다.
export interface Field extends Omit<FieldInput, "x" | "y" | "width" | "height"> {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const FIELD_TYPES: FieldType[] = ["TEXT", "NUMBER", "DATE", "CURRENCY"];
const MIN_DRAG_PX = 6;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;

function slugify(label: string, taken: Set<string>) {
  // 한글 라벨은 영문/숫자가 다 걸러져 빈 문자열이나 숫자만 남을 수 있다.
  // CSV 컬럼 매칭(ROADMAP 1.5)에 쓰일 키라 순수 숫자만 되는 건 피한다.
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = cleaned && !/^\d+$/.test(cleaned) ? cleaned : `field_${cleaned || "1"}`;
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}_${n++}`;
  }
  return candidate;
}

interface MappingStudioProps {
  templateId: string;
  templateName: string;
  pdfUrl: string;
  initialFields: Field[];
}

export function MappingStudio({
  templateId,
  templateName,
  pdfUrl,
  initialFields,
}: MappingStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  const [fields, setFields] = useState<Field[]>(initialFields);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // draftRef가 진짜 값이고 draft state는 드래그 중 미리보기 렌더링용일 뿐이다.
  // pointerup에서 state를 읽으면 같은 틱에 몰린 이벤트에서 batching 때문에 옛 값을 볼 수 있다.
  const draftRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    pdfjsLib.getDocument({ url: pdfUrl }).promise.then((doc) => {
      if (cancelled) return;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
    });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    (async () => {
      const pdfPage = await pdfDoc.getPage(page);
      if (cancelled) return;

      const unscaled = pdfPage.getViewport({ scale: 1 });
      setPageSize({ width: unscaled.width, height: unscaled.height });

      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      renderTask = pdfPage.render({ canvas, viewport });
      try {
        await renderTask.promise;
      } catch {
        // 페이지/줌이 빠르게 바뀌면 이전 렌더가 취소되는데 정상적인 흐름이라 무시한다.
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, page, scale]);

  const canvasWidth = pageSize ? pageSize.width * scale : 0;
  const canvasHeight = pageSize ? pageSize.height * scale : 0;

  // PDF 포인트 좌표(원점 좌하단, y 위로 증가)와 캔버스 픽셀(원점 좌상단, y 아래로 증가) 사이의 변환.
  // 저장되는 값은 항상 PDF 포인트 기준이라 scale(줌)을 바꿔도 기존 필드 위치가 어긋나지 않는다.
  function toCanvasRect(f: Pick<Field, "x" | "y" | "width" | "height">) {
    if (!pageSize) return { left: 0, top: 0, width: 0, height: 0 };
    return {
      left: f.x * scale,
      top: (pageSize.height - f.y - f.height) * scale,
      width: f.width * scale,
      height: f.height * scale,
    };
  }

  function toPdfRect(left: number, top: number, width: number, height: number) {
    const pageHeight = pageSize?.height ?? 0;
    return {
      x: left / scale,
      y: pageHeight - (top + height) / scale,
      width: width / scale,
      height: height / scale,
    };
  }

  function relativePoint(e: PointerEvent) {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-field-box]")) return;
    setSelectedId(null);
    const p = relativePoint(e);
    dragStart.current = p;
    const rect = { x: p.x, y: p.y, w: 0, h: 0 };
    draftRef.current = rect;
    setDraft(rect);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const p = relativePoint(e);
    const rect = {
      x: Math.min(dragStart.current.x, p.x),
      y: Math.min(dragStart.current.y, p.y),
      w: Math.abs(p.x - dragStart.current.x),
      h: Math.abs(p.y - dragStart.current.y),
    };
    draftRef.current = rect;
    setDraft(rect);
  }

  function handlePointerUp() {
    dragStart.current = null;
    const current = draftRef.current;
    draftRef.current = null;
    if (current && current.w >= MIN_DRAG_PX && current.h >= MIN_DRAG_PX) {
      const pdfRect = toPdfRect(current.x, current.y, current.w, current.h);
      const taken = new Set(fields.map((f) => f.key));
      const label = `필드 ${fields.length + 1}`;
      const newField: Field = {
        id: crypto.randomUUID(),
        key: slugify(label, taken),
        label,
        type: "TEXT",
        page,
        fontSize: 10,
        fixedValue: null,
        ...pdfRect,
      };
      setFields((prev) => [...prev, newField]);
      setSelectedId(newField.id);
    }
    setDraft(null);
  }

  const pageFields = fields.filter((f) => f.page === page);
  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  function updateSelected(patch: Partial<Field>) {
    if (!selectedId) return;
    setFields((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  function handleSave() {
    setSaveError(null);
    startSaving(async () => {
      const result = await saveTemplateFields(
        templateId,
        fields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          fontSize: f.fontSize,
          fixedValue: f.fixedValue,
        }))
      );
      if (result?.error) setSaveError(result.error);
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <span className="text-sm font-medium">{templateName}</span>
          <Link
            href={`/templates/${templateId}/versions`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            버전 기록
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {numPages || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= numPages}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={scale <= ZOOM_MIN}
              onClick={() => setScale((s) => Math.max(ZOOM_MIN, +(s - ZOOM_STEP).toFixed(2)))}
            >
              축소
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={scale >= ZOOM_MAX}
              onClick={() => setScale((s) => Math.min(ZOOM_MAX, +(s + ZOOM_STEP).toFixed(2)))}
            >
              확대
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-6">
          <div
            ref={overlayRef}
            className="relative touch-none select-none"
            style={{ width: canvasWidth, height: canvasHeight }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="block shadow"
            />

            {pageFields.map((f) => {
              const r = toCanvasRect(f);
              return (
                <div
                  key={f.id}
                  data-field-box
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(f.id);
                  }}
                  className={`absolute cursor-pointer border-2 ${
                    selectedId === f.id
                      ? "border-primary bg-primary/20"
                      : "border-blue-500 bg-blue-500/10"
                  }`}
                  style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
                >
                  <span className="absolute -top-5 left-0 whitespace-nowrap text-xs text-muted-foreground">
                    {f.label}
                  </span>
                </div>
              );
            })}

            {draft && (
              <div
                className="absolute border-2 border-dashed border-primary bg-primary/10"
                style={{ left: draft.x, top: draft.y, width: draft.w, height: draft.h }}
              />
            )}
          </div>
        </div>
      </div>

      <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l p-4">
        <div>
          <h2 className="text-sm font-semibold">필드 ({fields.length})</h2>
          <p className="text-xs text-muted-foreground">
            PDF 위를 클릭·드래그해서 값이 들어갈 자리를 표시하세요.
          </p>
        </div>

        <ul className="flex flex-col gap-1">
          {fields.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setPage(f.page);
                  setSelectedId(f.id);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                  selectedId === f.id ? "bg-muted" : ""
                }`}
              >
                <span>{f.label}</span>
                <span className="text-xs text-muted-foreground">p.{f.page}</span>
              </button>
            </li>
          ))}
          {fields.length === 0 && (
            <li className="text-xs text-muted-foreground">아직 필드가 없습니다.</li>
          )}
        </ul>

        {selectedField && (
          <div className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="field-label">필드 이름</Label>
              <Input
                id="field-label"
                value={selectedField.label}
                onChange={(e) => updateSelected({ label: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="field-type">타입</Label>
              <select
                id="field-type"
                value={selectedField.type}
                onChange={(e) => updateSelected({ type: e.target.value as FieldType })}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedField.fixedValue !== null}
                  onChange={(e) =>
                    updateSelected({ fixedValue: e.target.checked ? "" : null })
                  }
                />
                고정값 사용
              </label>
              {selectedField.fixedValue !== null && (
                <>
                  <Input
                    value={selectedField.fixedValue}
                    onChange={(e) => updateSelected({ fixedValue: e.target.value })}
                    placeholder="모든 행에 공통으로 들어갈 값"
                  />
                  <p className="text-xs text-muted-foreground">
                    이 필드는 CSV 컬럼과 매칭하지 않고 항상 이 값을 채웁니다.
                  </p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">key: {selectedField.key}</p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeField(selectedField.id)}
            >
              삭제
            </Button>
          </div>
        )}

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        <Button type="button" onClick={handleSave} disabled={isSaving || fields.length === 0}>
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </aside>
    </div>
  );
}
