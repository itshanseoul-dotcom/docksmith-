import type { Metadata } from "next";
import { DocumentLandingPage } from "@/components/document-landing-page";

export const metadata: Metadata = {
  title: "재직증명서 생성기 — 500장을 30초에 | Docksmith",
  description:
    "쓰던 재직증명서 양식에 필드만 한 번 표시해두면, 다음부터는 CSV만 올려서 여러 명의 재직증명서를 한 번에 만듭니다.",
};

export default function EmploymentCertificateGeneratorPage() {
  return (
    <DocumentLandingPage
      documentName="재직증명서"
      headline="재직증명서, 30초에 여러 명 몫 만들기"
      subheadline="요청이 들어올 때마다 하나씩 만들던 반복 작업을, 한 번 설정해두면 CSV 업로드만으로 끝냅니다."
    />
  );
}
