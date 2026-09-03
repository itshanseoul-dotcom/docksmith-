import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/business-info";

// 전자상거래법상 사업자 정보 표시 의무 + PG사 심사에서 요구하는 이용약관/개인정보처리방침/
// 환불정책 링크. 로그인 화면 안쪽(대시보드 등)에는 안 붙이고, 실제 상거래가 이뤄지는
// 공개 페이지(랜딩/요금제)에만 붙인다.
export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-8 text-xs text-muted-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <div className="flex flex-wrap gap-4">
          <Link href="/pricing" className="hover:text-foreground hover:underline">
            요금제
          </Link>
          <Link href="/terms" className="hover:text-foreground hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            개인정보처리방침
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground hover:underline">
            환불정책
          </Link>
        </div>
        <p>
          상호명: {BUSINESS_INFO.serviceName} · 대표자: {BUSINESS_INFO.representativeName} ·
          사업자등록번호: {BUSINESS_INFO.registrationNumber} · 통신판매업신고번호:{" "}
          {BUSINESS_INFO.mailOrderSalesNumber}
        </p>
        <p>
          주소: {BUSINESS_INFO.address} · 전화번호: {BUSINESS_INFO.phone} · 이메일:{" "}
          {BUSINESS_INFO.email}
        </p>
      </div>
    </footer>
  );
}
