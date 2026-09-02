import type { Metadata } from "next";
import { BUSINESS_INFO } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "이용약관 | Docksmith",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 text-sm leading-relaxed">
      <h1 className="text-lg font-semibold">Docksmith 이용약관</h1>

      <section>
        <h2 className="font-medium">제1조 (목적)</h2>
        <p className="mt-1 text-muted-foreground">
          이 약관은 {BUSINESS_INFO.representativeName}(이하 &quot;회사&quot;)이 제공하는
          문서 자동 생성 서비스 &quot;Docksmith&quot;(이하 &quot;서비스&quot;)의 이용과
          관련하여 회사와 이용자의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제2조 (서비스의 내용)</h2>
        <p className="mt-1 text-muted-foreground">
          서비스는 이용자가 업로드한 PDF/Word/Excel 문서 템플릿에 필드를 지정하고,
          CSV 데이터를 업로드하면 각 행마다 값이 채워진 문서를 브라우저에서 생성하여
          제공합니다. 문서 생성은 이용자의 브라우저에서 처리되며, CSV에 포함된 실제
          데이터는 회사의 서버로 전송되거나 저장되지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제3조 (회원가입 및 계정)</h2>
        <p className="mt-1 text-muted-foreground">
          이용자는 이메일 또는 Google 계정으로 가입할 수 있습니다. 이용자는 계정
          정보를 정확히 제공해야 하며, 계정 정보 관리 소홀로 발생하는 불이익에 대한
          책임은 이용자에게 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제4조 (요금제 및 결제)</h2>
        <p className="mt-1 text-muted-foreground">
          서비스는 무료 플랜과 유료 구독 플랜(월 정기결제)을 제공합니다. 유료 플랜은
          가입 시 명시된 요금이 매월 자동으로 결제되며, 결제는 서비스가 제휴한 결제대행사를
          통해 처리됩니다. 회사는 카드 번호 등 결제 수단 정보를 직접 수집·저장하지
          않습니다. 요금제 변경, 해지, 환불에 관한 사항은{" "}
          <a href="/refund-policy" className="underline">
            환불정책
          </a>
          을 따릅니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제5조 (이용자의 의무)</h2>
        <p className="mt-1 text-muted-foreground">
          이용자는 서비스를 이용하여 타인의 권리를 침해하거나 법령에 위반되는 문서를
          생성해서는 안 되며, 이로 인해 발생하는 모든 책임은 이용자 본인에게 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제6조 (계약 해지)</h2>
        <p className="mt-1 text-muted-foreground">
          이용자는 언제든지 계정 설정을 통해 서비스 이용을 중단하거나 구독을 해지할
          수 있습니다. 회사는 이용자가 이 약관을 위반한 경우 사전 통지 후 서비스
          이용을 제한하거나 계약을 해지할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제7조 (면책조항)</h2>
        <p className="mt-1 text-muted-foreground">
          회사는 천재지변, 통신 장애 등 불가항력적인 사유로 서비스를 제공할 수 없는
          경우 책임을 지지 않습니다. 생성된 문서의 내용에 대한 최종 확인 책임은
          이용자에게 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">제8조 (문의처)</h2>
        <p className="mt-1 text-muted-foreground">
          서비스 이용과 관련한 문의는 {BUSINESS_INFO.email}로 연락해주세요.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">시행일: 2026년 9월 2일</p>
    </div>
  );
}
