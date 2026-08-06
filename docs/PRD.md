# Docksmith — Product Requirements Document (PRD)

> Upload once. Automate forever.
> 반복 문서 작업(대량 인보이스·패킹리스트·통관서류 등)을 클릭 몇 번으로 자동 생성하는 문서 자동화 SaaS

**버전**: v0.1 (MVP 설계 단계)
**작성일**: 2026-08-06
**대상 독자**: 1인 창업자(본인), 향후 합류할 개발자/디자이너, 초기 투자자/어드바이저

---

## 0. 한눈에 보는 포지셔닝

- **오늘(MVP)**: "물류·통관 담당자가 Commercial Invoice, Packing List, FedEx/DHL Invoice, TSCA, MSDS 같은 반복 서류를 CSV 한 번 업로드로 수백~수천 건 자동 생성한다."
- **내일(V1~V2)**: "어떤 회사든 반복되는 서류(계약서, 인보이스, 증명서, HR 서류 등)를 템플릿 한 번 등록으로 무한 자동 생성하는 업무 자동화 플랫폼."
- **핵심 차별점**: 범용 "문서 자동화" 시장(Adobe, Docupilot, PandaDoc 등 수백 개 경쟁사)과 정면승부하지 않고, 물류·통관이라는 좁고 구체적인 반복 업무 문제를 먼저 완벽하게 푼다.
- **비용 구조 원칙**: 문서 생성은 원칙적으로 **브라우저(클라이언트)에서** 수행한다. 서버는 인증·과금·템플릿 메타데이터만 다룬다 → 고객이 늘어도 서버비가 선형으로 늘지 않는다.

---

## 1. 서비스 목표

### 1.1 문제 정의
물류/수출입 담당자는 동일한 양식(FedEx Invoice, Commercial Invoice, Packing List, TSCA, MSDS 등)에 매번 다른 값(송장번호, 수량, 금액, 수하인 정보)만 바꿔서 반복 작성한다. 이 작업은:
- 엑셀 → 서류 양식으로 복붙하는 수작업이라 시간이 오래 걸리고
- 오탈자·누락 같은 human error가 잦고
- 신입 직원 교육에도 시간이 든다.

### 1.2 솔루션
1. 원본 서류 양식(PDF)을 업로드한다.
2. 서류 위에서 값이 바뀌는 칸(송장번호, 금액, 날짜 등)을 클릭해서 "필드"로 지정한다.
3. CSV/Excel로 여러 건의 데이터를 업로드한다.
4. "생성" 버튼 한 번으로 행(row) 개수만큼 서류가 자동으로 채워져서 ZIP으로 다운로드된다.
5. 같은 양식은 다음부터 매핑 없이 CSV만 올리면 바로 생성된다 (재사용 가치가 핵심).

### 1.3 목표 지표 (North Star & 보조지표)
- **North Star**: 월간 생성 문서 수 (Documents Generated / Month)
- 보조지표: 템플릿당 재사용 횟수(재사용률이 높을수록 이탈 낮음), 무료→유료 전환율, MRR
- **6개월 목표**: 유료 고객 100~300개, MRR $3,000~7,500 (ChatGPT 분석 시뮬레이션 기준)

### 1.4 타겟 사용자 (MVP)
- 1차: 중소 규모 수출기업, 포워더, 3PL 담당자 (실무자 본인 도메인 지식과 일치)
- 2차 확장: Amazon/이커머스 셀러 중 해외배송 비중이 큰 판매자, Shopify 셀러
- 3차 확장(V2+): 반복 서류가 많은 다른 산업(회계, HR, 법무, 병원)

---

## 2. 핵심 기능

### 2.1 템플릿 매핑 스튜디오 (MVP 핵심 기능 — 최우선)
- PDF 템플릿 업로드
- PDF를 화면에 렌더링 → 사용자가 값이 들어갈 위치를 클릭/드래그로 지정
- 필드별 속성 지정: 이름(예: `invoice_no`), 타입(text/number/date/currency), 폰트 크기
- 매핑 결과는 템플릿에 저장되어 재사용됨(다음부터 매핑 과정 스킵)

### 2.2 대량 생성 엔진 (Bulk Generation Engine)
- CSV/Excel 업로드
- 컬럼명 ↔ 필드 자동 매칭 (AI 아님 — 동의어 딕셔너리 기반: `invoice no`, `invoice#`, `INV NO` 등을 같은 필드로 인식)
- 매칭 안 된 컬럼은 사용자가 수동으로 드롭다운에서 연결
- 생성 전 미리보기(첫 3~5건 렌더링)
- 검증: 필수 필드 누락, 날짜/숫자 형식 오류를 사전에 표시
- 실행 → 브라우저에서 각 행마다 PDF 생성 → ZIP으로 묶어서 다운로드

### 2.3 템플릿 라이브러리 (MVP는 소규모)
- Commercial Invoice, Packing List, FedEx Invoice, DHL Invoice, TSCA, MSDS 샘플/스타터 템플릿 제공
- 사용자가 직접 만든 템플릿 목록 저장 및 관리

### 2.4 파일명 규칙 자동화
- `{invoice_no}_{date}.pdf` 같은 패턴으로 자동 파일명 생성
- ZIP 다운로드 시 폴더 구조 옵션

### 2.5 계정 및 과금
- 이메일 가입/로그인 (+ Google OAuth)
- 사용량 기반 플랜: Free / Starter / Pro / Team (섹션 12 참고)
- Stripe 구독 결제

### 2.6 연동 (V1 이후)
- Shopify App: 주문 데이터를 CSV 없이 직접 문서 생성에 연결
- Google Drive / Dropbox 저장 (유료 옵션)
- Webhook / API (Enterprise)

### 2.7 프라이버시 설계 원칙
- 생성된 문서는 **기본적으로 서버에 저장하지 않는다** — 브라우저에서 생성 후 바로 다운로드
- 서버에는 템플릿 원본 파일과 필드 매핑 정보만 저장
- (유료) 클라우드 보관을 원하는 사용자만 옵션으로 서버/외부 스토리지에 저장

---

## 3. 사용자 플로우

### 3.1 신규 가입 → 첫 문서 생성 (Aha Moment까지 최단 경로)
```
랜딩 페이지 (예: "FedEx Commercial Invoice Generator")
 → 무료로 시작하기 클릭
 → 이메일 가입 (또는 Google 로그인)
 → 샘플 템플릿 선택 or 자기 PDF 업로드
 → 필드 클릭 매핑 (3~5개 필드, 2분 이내)
 → 샘플 CSV 업로드 (또는 제공된 예시 CSV로 체험)
 → "생성" 클릭 → 3초 내 ZIP 다운로드
 → "방금 10건의 서류를 3초에 만들었습니다" 피드백 메시지
```

### 3.2 재사용 플로우 (2회차 이상 — 핵심 리텐션 경로)
```
대시보드 → 기존 템플릿 선택 → CSV만 업로드 → 생성 → 다운로드
(매핑 과정 없음, 총 소요시간 30초 이내)
```

### 3.3 Shopify 주문 자동화 플로우 (V1+)
```
Shopify 주문 발생 → Webhook 수신 → 사용자가 대시보드에서 기간/상태로 주문 선택
 → 미리 연결된 템플릿에 자동 매핑 → 생성 → 다운로드 또는 자동 이메일 발송
```

---

## 4. 화면 설계

| 화면 | 목적 | 핵심 요소 |
|---|---|---|
| 랜딩 페이지 (다수, SEO용) | 구체적 검색어로 유입 ("FedEx Commercial Invoice Generator") | 문제 설명, Before/After, 무료 CTA |
| 대시보드 | 내 템플릿과 최근 생성 이력 한눈에 | 템플릿 카드 목록, "새 템플릿" 버튼, 최근 생성 로그 |
| 템플릿 매핑 스튜디오 | PDF 위에서 필드 지정 | PDF 뷰어, 클릭-드래그 오버레이, 필드 속성 패널 |
| 데이터 업로드 & 생성 실행 | CSV 업로드 → 매칭 확인 → 실행 | 컬럼-필드 매칭 테이블, 미리보기, 진행률 바 |
| 생성 결과 화면 | 결과 확인 및 다운로드 | 성공/실패 건수, ZIP 다운로드 버튼, 오류 목록 |
| 설정/과금 | 플랜 관리, 사용량 확인 | 현재 플랜, 사용량 게이지, 업그레이드 버튼 |

---

## 5. 데이터베이스 구조 (개념 스키마)

```
users            (id, email, name, created_at)
organizations    (id, name, plan, stripe_customer_id)
memberships      (user_id, org_id, role)            -- V1+에서 의미 있음, MVP는 org=1인

templates        (id, org_id, name, category, source_file_url, page_count, created_at)
template_fields  (id, template_id, key, label, type, page, x, y, width, height, font_size)

generation_jobs      (id, template_id, org_id, source_data_name, row_count, status, created_at)
generation_job_items (id, job_id, row_index, row_data JSON, status, error_message)

column_alias_dictionary (canonical_key, alias)   -- "invoice_no" ↔ "INV NO", "Invoice#"...

subscriptions (org_id, plan, status, usage_count_this_period, period_reset_at)
```

**설계 원칙**: `generation_job_items`에 생성된 **파일 자체는 저장하지 않는다** (섹션 9 참고). 상태(성공/실패)와 원본 행 데이터만 남겨 재실행/디버깅에 활용한다.

---

## 6. API 설계

REST, `/api/v1/*`, JSON. 인증은 세션 쿠키(웹) + API Key(Enterprise).

```
POST   /templates                     템플릿 업로드
GET    /templates                     내 템플릿 목록
GET    /templates/:id                 템플릿 상세(필드 포함)
PATCH  /templates/:id/fields          필드 매핑 저장

POST   /templates/:id/jobs            CSV 업로드 + 생성 job 시작 (row 검증 포함)
GET    /jobs/:id                      job 상태 조회 (진행률 폴링용)
GET    /jobs/:id/items                실패 항목 상세

GET    /billing/plan                  현재 플랜/사용량
POST   /billing/checkout              Stripe checkout session 생성
POST   /webhooks/stripe               Stripe 이벤트 수신

POST   /webhooks/shopify/orders       (V1+) Shopify 주문 이벤트 수신
```

> 실제 PDF 생성 자체는 서버 API가 아니라 **브라우저에서 실행**되므로, `/jobs`는 "생성 기록"을 남기는 용도이고 실제 PDF 바이트는 클라이언트→클라이언트로 처리된다 (섹션 9).

---

## 7. 권한 구조

- MVP: 1 계정 = 1 조직(org), role 구분 없음 (단순화)
- V1: Owner / Admin / Member 역할 도입, 템플릿 단위 공유
- Enterprise: SSO/SAML, 조직 내 세부 권한 정책, Audit Log

---

## 8. 템플릿 저장 방식

- 원본 PDF 템플릿 파일: 객체 스토리지(Cloudflare R2 — S3 호환, egress 비용 없음)에 저장 — **이건 재사용 자산이므로 영구 저장 대상**이다 (생성된 결과 문서와는 다르다)
- 필드 좌표/타입 매핑: DB에 JSON으로 저장
- V1+: 템플릿 버전 관리(수정 시 이전 버전 보관), 팀 공유

---

## 9. PDF 생성 방식 — 아키텍처의 핵심 결정

ChatGPT 분석에서 강하게 권고한 방향을 그대로 채택한다: **가능한 한 서버가 아니라 브라우저에서 생성한다.**

- **클라이언트 사이드 생성**: `pdf-lib`(JS)로 브라우저 내에서 템플릿 PDF의 필드 좌표에 CSV 각 행의 값을 채워 넣어 PDF를 만든다.
  - 장점: 서버 CPU 비용이 거의 0, 사용자의 서류 데이터가 서버로 전송되지 않아 프라이버시 이점(마케팅 포인트로도 활용 가능)
  - 대량(수백~수천 건) 처리 시 Web Worker로 백그라운드 처리 + 배치 단위(예: 100건씩) 처리로 브라우저 멈춤 방지, 진행률 표시
- **ZIP 압축**: `jszip`으로 클라이언트에서 묶어서 한 번에 다운로드
- **Word 템플릿(V1+)**: `docxtemplater`로 동일하게 클라이언트에서 처리
- **예외 — 서버 사이드가 필요한 경우(V1+/Enterprise만)**:
  - Shopify Webhook처럼 **사람이 브라우저에 앉아있지 않은** 무인 자동 생성
  - API를 통한 외부 시스템 연동
  - 이 경우에만 Node.js 서버에서 동일한 `pdf-lib` 로직을 재사용해 서버 사이드로 생성하고, 결과는 임시 저장 후 일정 시간 뒤 자동 삭제한다.

---

## 10. 확장성을 고려한 아키텍처 (개요 — 상세는 별도 아키텍처 문서에서)

- **Frontend**: Next.js (React) — SEO용 랜딩페이지 다수를 정적 생성하기 좋고, 문서 생성 로직 자체가 클라이언트에서 실행되므로 프레임워크 선택이 곧 제품 아키텍처와 직결된다.
- **Backend**: 가벼운 API 서버(Next.js API Routes 또는 별도 Fastify) — 인증, 템플릿 메타데이터, 과금만 처리.
- **DB**: PostgreSQL (매니지드, 예: Supabase) — 운영 부담 최소화.
- **Storage**: Cloudflare R2 — 템플릿 원본만 저장, egress 무료.
- **Queue/Worker**: V1+에서 Shopify/API 자동화가 생기면 도입 (BullMQ + Redis). MVP에는 불필요.
- **Deployment**: Docker 기반, Fly.io/Railway 같은 저비용 PaaS로 시작.
- **Auth**: Supabase Auth 또는 Clerk (이메일 + Google OAuth).
- **Billing**: Stripe.

(세부 근거와 대안 비교는 2단계 "기술 아키텍처 설계" 문서에서 다룬다.)

---

## 11. 향후 Shopify App으로 확장하는 방법

1. Shopify OAuth로 앱 설치 → 주문 데이터 접근 권한 획득
2. 주문 필드(주문번호, 수하인 주소, 상품명/수량/금액 등)를 표준 alias로 미리 매핑해두어, 사용자가 CSV 없이도 "주문 100건 선택 → 생성" 가능하게 함
3. 대량 처리이므로 이 경로는 서버 사이드 생성(섹션 9의 예외 케이스)으로 처리
4. Shopify App Store 등록 시 Shopify Billing API 또는 자체 Stripe 결제 중 택1 (수수료 구조 비교 필요)
5. 웹 서비스에서 먼저 검증된 템플릿/매핑 엔진을 그대로 재사용 — Shopify App은 "새 데이터 소스"를 추가하는 것일 뿐, 생성 엔진은 동일

---

## 12. 기업 고객을 위한 Enterprise 기능 (V2+)

- SSO/SAML
- API Key 발급 및 무인 생성 API (서버 사이드 렌더링 활용)
- 화이트레이블/커스텀 도메인
- Audit Log
- 전담 지원 및 SLA
- 대용량 처리 전용 Queue 우선순위

**가격 구조 초안** (ChatGPT 분석 기반):
| 플랜 | 가격 | 한도 |
|---|---|---|
| Free | $0 | 월 20건 생성 |
| Starter | $9/월 | 월 500건 |
| Pro | $29/월 | 무제한 |
| Team | $79/월 | 팀 공유, 다수 시트 |
| Enterprise | 별도 문의 | API, SSO, SLA |

---

## 13. MVP에서 제외해야 하는 기능

의도적으로 미룬다 — 범위가 커지면 출시가 늦어지고, 정작 핵심 가치(반복 서류 자동화)를 검증하기 전에 지친다.

- ❌ AI 기반 자동 필드 인식(OCR/LLM) → 동의어 딕셔너리 매칭으로 충분 (섹션 2.2)
- ❌ Word/Excel **템플릿** 지원 (MVP는 PDF 템플릿만; 데이터 입력은 CSV/Excel 허용)
- ❌ Shopify App, API, Webhook (V1로 미룸)
- ❌ Google Drive/Dropbox 저장 연동
- ❌ 팀/역할 권한, SSO
- ❌ 전자서명, 바코드/QR 자동 생성
- ❌ 다국어 UI (한국어 실무자 + 영어 국제 사용자만 우선 고려하되 UI는 영어로 시작 — SEO/글로벌 확장 목적)

---

## 부록: 리스크 및 열린 질문

- 브랜드명 "Docksmith" 확정 (2026-08-06) — 최종 상표/도메인 정식 확인은 실제 등록 전 진행 필요.
- PDF 템플릿이 스캔 이미지(텍스트 레이어 없음)인 경우 클릭 매핑은 가능하지만 좌표 기반 오버레이만 동작 — OCR 기반 자동 인식은 MVP 범위 밖.
- 브라우저에서 수천 건 PDF 생성 시 메모리/성능 한계치는 실측 필요 (프로토타입 단계에서 벤치마크 예정).
