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
        <Label htmlFor="file">PDF 파일</Label>
        <Input id="file" name="file" type="file" accept="application/pdf" required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        업로드
      </Button>
    </form>
  );
}
