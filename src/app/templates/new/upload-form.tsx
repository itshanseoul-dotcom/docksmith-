"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadTemplate, type UploadFormState } from "../actions";

const initialState: UploadFormState = undefined;

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadTemplate, initialState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">템플릿 이름</Label>
        <Input id="name" name="name" placeholder="예: Commercial Invoice" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file">템플릿 파일 (PDF, Word, Excel)</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
        />
        <p className="text-xs text-muted-foreground">
          Word/Excel은 값이 들어갈 자리에 미리 {"{invoice_no}"} 같은 태그를 입력해두세요.
        </p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        업로드
      </Button>
    </form>
  );
}
