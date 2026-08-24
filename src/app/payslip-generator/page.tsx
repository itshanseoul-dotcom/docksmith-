import type { Metadata } from "next";
import { DocumentLandingPage } from "@/components/document-landing-page";

export const metadata: Metadata = {
  title: "급여명세서 생성기 — 500장을 30초에 | Docksmith",
  description:
    "쓰던 급여명세서 PDF/Excel 양식에 필드만 한 번 표시해두면, 다음부터는 CSV만 올려서 전 직원 급여명세서를 한 번에 만듭니다.",
};

export default function PayslipGeneratorPage() {
  return (
    <DocumentLandingPage
      documentName="급여명세서"
      headline="급여명세서, 30초에 전 직원 몫 만들기"
      subheadline="매달 엑셀에서 직원 한 명씩 복사해 붙여넣던 반복 작업을, 한 번 설정해두면 CSV 업로드만으로 끝냅니다."
    />
  );
}
