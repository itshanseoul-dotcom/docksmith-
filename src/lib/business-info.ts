// 전자상거래법상 표시 의무가 있는 사업자 정보 — footer/약관/개인정보처리방침이 전부
// 이 값을 참조한다.
export const BUSINESS_INFO = {
  serviceName: "Docksmith",
  representativeName: "김한서",
  registrationNumber: "561-02-04276",
  address: "경기도 고양시 일산동구 고풍로 55",
  email: "itshanseoul@gmail.com",
  phone: "010-2615-0598",
  // PG(KCP 등) 사전심사 필수 항목. 전자상거래법 시행령상 통신판매 거래횟수가
  // 일정 건수 미만이면 통신판매업 신고 면제 대상이다 — 아직 실거래가 없는 동안은
  // 면제 대상이지만, 거래량이 늘어나면 정부24에서 신고 후 아래 값을
  // "제OOOO-서울OO-OOOO호" 형식의 번호로 교체해야 한다.
  mailOrderSalesNumber: "통신판매업 신고 면제대상(통신판매 거래횟수 요건)",
};
