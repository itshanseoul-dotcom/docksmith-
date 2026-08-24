"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTemplateFields, type FieldInput } from "./actions";
import type { FieldType } from "@/generated/prisma/client";

export interface TagField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  fixedValue: string | null;
}

const FIELD_TYPES: FieldType[] = ["TEXT", "NUMBER", "DATE", "CURRENCY"];

interface TagFieldEditorProps {
  templateId: string;
  templateName: string;
  fileType: "DOCX" | "XLSX";
  initialFields: TagField[];
}

export function TagFieldEditor({
  templateId,
  templateName,
  fileType,
  initialFields,
}: TagFieldEditorProps) {
  const [fields, setFields] = useState<TagField[]>(initialFields);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateField(id: string, patch: Partial<TagField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function handleSave() {
    setSaveError(null);
    startSaving(async () => {
      const payload: FieldInput[] = fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        page: 1,
        x: null,
        y: null,
        width: null,
        height: null,
        fontSize: 10,
        fixedValue: f.fixedValue,
      }));
      const result = await saveTemplateFields(templateId, payload);
      if (result?.error) setSaveError(result.error);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{templateName}</h1>
          <p className="text-xs text-muted-foreground">
            문서에서 {"{태그}"} {fields.length}개를 찾았습니다. 이름과 타입을 확인하고
            저장하세요.
          </p>
        </div>
        <Link
          href={`/templates/${templateId}/versions`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          버전 기록
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {fields.map((f) => (
          <li key={f.id} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">태그: {`{${f.key}}`}</p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeField(f.id)}
              >
                삭제
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`label-${f.id}`}>필드 이름</Label>
              <Input
                id={`label-${f.id}`}
                value={f.label}
                onChange={(e) => updateField(f.id, { label: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`type-${f.id}`}>타입</Label>
              <select
                id={`type-${f.id}`}
                value={f.type}
                onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
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
                  checked={f.fixedValue !== null}
                  onChange={(e) =>
                    updateField(f.id, { fixedValue: e.target.checked ? "" : null })
                  }
                />
                고정값 사용
              </label>
              {f.fixedValue !== null && (
                <Input
                  value={f.fixedValue}
                  onChange={(e) => updateField(f.id, { fixedValue: e.target.value })}
                  placeholder="모든 행에 공통으로 들어갈 값"
                />
              )}
            </div>
          </li>
        ))}
        {fields.length === 0 && (
          <li className="text-sm text-muted-foreground">
            필드가 없습니다. {fileType === "DOCX" ? "Word" : "Excel"} 파일에{" "}
            {"{필드명}"} 태그를 추가하고 새 템플릿으로 다시 업로드해주세요.
          </li>
        )}
      </ul>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      <Button type="button" onClick={handleSave} disabled={isSaving || fields.length === 0}>
        {isSaving ? "저장 중..." : "저장"}
      </Button>
    </div>
  );
}
