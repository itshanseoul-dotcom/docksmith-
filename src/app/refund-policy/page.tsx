import type { Metadata } from "next";
import { BUSINESS_INFO } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "환불정책 | Docksmith",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 text-sm leading-relaxed">
      <h1 className="text-lg font-semibold">Docksmith 환불정책</h1>

      <section>
        <h2 className="font-medium">1. 청약철회</h2>
        <p className="mt-1 text-muted-foreground">
          유료 플랜을 처음 결제한 경우, 결제일로부터 7일 이내에는 서비스를
          실질적으로 이용(문서 생성)하지 않았다면 전액 환불을 요청할 수 있습니다.
          전자상거래 등에서의 소비자보호에 관한 법률에 따릅니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">2. 정기결제 해지</h2>
        <p className="mt-1 text-muted-foreground">
          구독은 언제든지 해지할 수 있으며, 해지 시 다음 결제일부터 요금이
          청구되지 않습니다. 이미 결제된 이용 기간에 대한 일할 환불은 제공하지
          않으며, 해지 후에도 해당 결제 기간이 끝날 때까지는 서비스를 계속
          이용하실 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">3. 서비스 장애로 인한 환불</h2>
        <p className="mt-1 text-muted-foreground">
          회사의 귀책사유로 서비스를 정상적으로 이용하지 못한 기간이 있는 경우,
          해당 기간에 비례하여 요금의 일부를 환불하거나 다음 결제에서 차감합니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">4. 환불 절차</h2>
        <p className="mt-1 text-muted-foreground">
          환불을 원하시면 {BUSINESS_INFO.email}로 결제 정보와 사유를 함께 보내주세요.
          확인 후 영업일 기준 7일 이내에 결제 시 사용한 수단으로 환불해드립니다.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">시행일: 2026년 9월 2일</p>
    </div>
  );
}
