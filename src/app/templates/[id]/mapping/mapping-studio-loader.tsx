"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MappingStudio } from "./mapping-studio";

// pdfjs-dist는 브라우저 전용(Canvas/Worker)이라 SSR에서 돌면 안 된다.
const MappingStudioClient = dynamic(
  () => import("./mapping-studio").then((mod) => mod.MappingStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        PDF 뷰어를 불러오는 중...
      </div>
    ),
  }
);

export function MappingStudioLoader(props: ComponentProps<typeof MappingStudio>) {
  return <MappingStudioClient {...props} />;
}
