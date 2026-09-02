// 전자상거래법상 표시 의무가 있는 사업자 정보 — footer/약관/개인정보처리방침이 전부
// 이 값을 참조한다. 사업자등록증이 나오면 registrationNumber만 채우면 된다.
export const BUSINESS_INFO = {
  serviceName: "Docksmith",
  representativeName: "김한서",
  registrationNumber: "사업자등록증 발급 후 표시 예정",
  address: "사업장 주소 등록 예정",
  email: "itshanseoul@gmail.com",
  phone: "010-2615-0598",
  // PG(KG이니시스 등) 사전심사 필수 항목 — 통신판매업 신고는 사업자등록과 별개로
  // 진행해야 한다(구매안전서비스 이용확인증 발급 → 정부24 신고). 신고 완료되면
  // "제OOOO-서울OO-OOOO호" 형식의 번호로 교체.
  mailOrderSalesNumber: "통신판매업 신고 진행 예정",
};
