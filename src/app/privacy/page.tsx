import type { Metadata } from "next";
import { BUSINESS_INFO } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Docksmith",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 text-sm leading-relaxed">
      <h1 className="text-lg font-semibold">Docksmith 개인정보처리방침</h1>
      <p className="text-muted-foreground">
        Docksmith(이하 &quot;회사&quot;)는 개인정보보호법에 따라 이용자의 개인정보를
        보호하고 이와 관련한 고충을 신속하게 처리할 수 있도록 다음과 같이
        개인정보처리방침을 수립·공개합니다.
      </p>

      <section>
        <h2 className="font-medium">1. 수집하는 개인정보 항목</h2>
        <ul className="mt-1 list-disc pl-5 text-muted-foreground">
          <li>회원가입 시: 이메일 주소 (Google 로그인 시 이름, 프로필 이미지)</li>
          <li>결제 시: 결제 처리를 위해 결제대행사에 전달되는 정보(카드 정보 등) — 회사 서버에는 저장되지 않습니다</li>
          <li>서비스 이용 중: 업로드한 문서 템플릿 파일, 생성 건수·시각 등 이용 기록</li>
          <li>오류 발생 시: 오류 메시지, 스택 트레이스, 발생 시각, 소속 조직 식별자</li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          <strong>CSV로 업로드하는 실제 데이터(수취인 정보, 금액 등)는 이용자의
          브라우저에서만 처리되며, 회사 서버로 전송되거나 저장되지 않습니다.</strong>{" "}
          문서 생성 자체가 브라우저에서 이루어지기 때문입니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">2. 개인정보의 수집 및 이용 목적</h2>
        <ul className="mt-1 list-disc pl-5 text-muted-foreground">
          <li>회원 식별 및 로그인 유지</li>
          <li>서비스 제공 및 요금제별 이용 한도 관리</li>
          <li>유료 구독 결제 처리</li>
          <li>서비스 오류 확인 및 개선</li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium">3. 개인정보의 보유 및 이용 기간</h2>
        <p className="mt-1 text-muted-foreground">
          회원 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 거래
          기록 등은 해당 법령이 정한 기간 동안 보관합니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">4. 개인정보의 처리 위탁</h2>
        <p className="mt-1 text-muted-foreground">
          회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.
        </p>
        <ul className="mt-1 list-disc pl-5 text-muted-foreground">
          <li>Supabase (인증 및 데이터베이스 호스팅)</li>
          <li>Vercel (애플리케이션 호스팅)</li>
          <li>포트원 및 제휴 결제대행사 (결제 처리)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-medium">5. 정보주체의 권리</h2>
        <p className="mt-1 text-muted-foreground">
          이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수
          있으며, 아래 문의처로 연락하시면 지체 없이 조치하겠습니다.
        </p>
      </section>

      <section>
        <h2 className="font-medium">6. 개인정보 보호책임자</h2>
        <p className="mt-1 text-muted-foreground">
          성명: {BUSINESS_INFO.representativeName} · 이메일: {BUSINESS_INFO.email} ·
          연락처: {BUSINESS_INFO.phone}
        </p>
      </section>

      <p className="text-xs text-muted-foreground">시행일: 2026년 9월 2일</p>
    </div>
  );
}
