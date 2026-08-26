import type { FieldSpec } from "./types";

// pdf-worker.ts/docx-worker.ts/xlsx-worker.ts는 이 메시지 모양을 똑같이 쓴다 —
// 어느 파일 형식이든 csv-matcher.tsx 쪽에서 같은 방식으로 다룰 수 있어야 하기 때문.
export interface GenerateRequest {
  templateBytes: ArrayBuffer;
  fields: FieldSpec[];
  rows: Record<string, string>[];
}

export type GenerateResponse =
  | { type: "row-done"; index: number; total: number; fileName: string; bytes: ArrayBuffer }
  | { type: "row-error"; index: number; total: number; message: string }
  | { type: "done" };

export interface WorkerLike {
  postMessage(message: GenerateResponse, transfer?: Transferable[]): void;
}

// tsconfig의 lib에 "webworker"가 없어서(dom과 동시에 못 씀) self의 타입이 Window로
// 잡힌다. postMessage 시그니처가 달라서 실제로 필요한 모양만 뽑아 캐스팅해서 쓴다.
export function getWorkerSelf(): WorkerLike {
  return self as unknown as WorkerLike;
}
