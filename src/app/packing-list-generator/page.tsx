import type { Metadata } from "next";
import { DocumentLandingPage } from "@/components/document-landing-page";

export const metadata: Metadata = {
  title: "Packing List 생성기 — 500장을 30초에 | Docksmith",
  description:
    "쓰던 Packing List PDF 양식에 필드만 한 번 표시해두면, 다음부터는 CSV만 올려서 수백 장을 한 번에 만듭니다.",
};

export default function PackingListGeneratorPage() {
  return (
    <DocumentLandingPage
      documentName="Packing List"
      headline="Packing List, 30초에 500장 만들기"
      subheadline="매번 엑셀에서 하나씩 복사해 붙여넣던 반복 작업을, 한 번 설정해두면 CSV 업로드만으로 끝냅니다."
    />
  );
}
