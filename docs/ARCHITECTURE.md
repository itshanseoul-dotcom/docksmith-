# Docksmith — 기술 아키텍처 설계

**전제 조건** (요구사항 그대로): 1인 개발, 월 10만 사용자까지 확장 가능, 유지보수 최소화, 서버 비용 최소화, 보안 우선, Docker 기반, API 중심 설계, 향후 AI 기능 추가 가능.

**설계 철학 한 줄 요약**: *서버는 최대한 "아무것도 안 하게" 만든다.* PDF 생성이라는 이 서비스의 핵심 작업을 브라우저로 밀어내면, 나머지(인증/과금/메타데이터)는 어떤 스택을 골라도 가벼워서 1인 개발자가 감당할 수 있는 범위에 들어온다. 이게 이 아키텍처의 전체를 관통하는 원칙이다.

---

## 1. 전체 구조 (한눈에)

```
                         ┌─────────────────────────┐
                         │        Browser            │
                         │  (템플릿 매핑 + PDF 생성)   │  ← 핵심 워크로드는 여기서 처리
                         │  pdf-lib / pdfjs / jszip   │
                         └───────────┬────────────────┘
                                     │ REST API (JSON)
                                     ▼
                         ┌─────────────────────────┐
                         │   Next.js App (Docker)    │
                         │  - UI 렌더링 (SSR/SSG)      │
                         │  - API Route Handlers      │  ← 가벼운 메타데이터/인증/과금만
                         └───────────┬────────────────┘
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              ┌───────────┐  ┌──────────────┐  ┌──────────┐
              │ Supabase   │  │   Stripe      │  │  Sentry   │
              │ Postgres   │  │   Billing     │  │ /PostHog  │
              │ + Auth     │  │               │  │           │
              │ + Storage  │  └──────────────┘  └──────────┘
              └───────────┘

  (V1+에서만 추가) ─────────────────────────────────────
              ┌───────────────┐      ┌──────────────┐
              │ Redis(Upstash) │ ───▶ │ Worker(Docker)│  ← Shopify/API 무인 생성 전용
              │ + BullMQ Queue │      │ 서버사이드 pdf-lib│
              └───────────────┘      └──────────────┘
```

---

## 2. Frontend — Next.js (App Router) + TypeScript + Tailwind

**선택 이유**
- SEO 랜딩페이지를 수십~수백 개("FedEx Commercial Invoice Generator" 등) 찍어내야 하는데, Next.js의 SSG/ISR이 정확히 이 요구에 맞는다.
- 문서 생성 로직(pdf-lib) 자체가 클라이언트에서 도는 게 이 아키텍처의 핵심이므로, 프론트엔드가 "얇은 화면"이 아니라 "실제 엔진이 돌아가는 곳"이다. React 생태계가 Web Worker, 파일 처리 라이브러리 지원이 가장 두텁다.
- Backend도 같은 Next.js 프로젝트의 Route Handler로 두면, 1인 개발자가 언어/툴체인을 하나로 유지할 수 있다 (유지보수 최소화 조건에 직결).

**핵심 라이브러리**
| 용도 | 라이브러리 | 비고 |
|---|---|---|
| PDF 렌더링(매핑 화면에 보여주기) | `pdfjs-dist` | Mozilla PDF.js — 좌표 클릭 오버레이 구현 |
| PDF 필드 채우기(생성) | `pdf-lib` | 서버 없이 브라우저에서 PDF 바이트 조작 |
| CSV 파싱 | `papaparse` | 대용량 CSV도 스트리밍 파싱 가능 |
| Excel 파싱(데이터 입력용) | `exceljs` | .xlsx 읽기 |
| ZIP 묶기 | `jszip` | 생성된 PDF 다건을 zip으로 |
| 대량 처리 시 UI 안 멈추게 | Web Worker | 위 라이브러리들을 워커 스레드에서 실행 |
| 서버 데이터 fetching | `@tanstack/react-query` | 캐싱/리페치 자동화로 코드량 최소화 |

---

## 3. Backend/API — Next.js Route Handlers (모놀리스로 시작)

**선택 이유**
- 별도 Express/Fastify 서버를 두지 않는다. 1인 개발자에게 "배포 대상이 하나 더 생긴다"는 건 유지보수 비용이지 이점이 아니다. Next.js Route Handler로 REST API(PRD 6장 스펙)를 그대로 구현한다.
- API 중심 설계 조건은 "프레임워크 분리"가 아니라 "명확한 계약(contract)"으로 충족한다 — `/api/v1/*` 네임스페이스, Zod로 요청/응답 스키마 고정, 나중에 Enterprise API로 외부 공개할 때도 같은 엔드포인트를 그대로 노출하면 된다.
- V1+에서 Shopify Webhook·서버사이드 생성처럼 무거운 작업이 생기면, 그때 **Worker를 별도 Docker 컨테이너로 분리**한다 (섹션 8). 웹 서버는 계속 가볍게 유지.

**검증**: 모든 입력은 Zod 스키마로 파싱 후 처리 (파일 업로드 MIME/크기 제한 포함).

---

## 4. Database — PostgreSQL (Supabase 매니지드)

**선택 이유**
- 관계형 데이터(조직-템플릿-필드-생성기록)라 Postgres가 자연스럽다.
- 매니지드(Supabase)를 쓰는 이유는 순수하게 유지보수 최소화: 백업, 마이그레이션, 커넥션 풀링(PgBouncer 내장), 대시보드가 기본 제공된다. 직접 EC2에 Postgres 올리는 것과 비교하면 1인 개발자 시간을 압도적으로 아낀다.
- **Row Level Security(RLS)**를 조직(org_id) 기준으로 걸어서, 애플리케이션 코드 버그가 있어도 DB 레벨에서 다른 조직 데이터가 새어나가지 않게 한다 (보안 우선 조건).

**ORM**: Prisma — 타입 안전성 + 마이그레이션 diff + Prisma Studio(데이터 직접 조회/수정 GUI)로 운영 중 디버깅이 쉬워진다. Drizzle보다 러닝커브는 있지만 생태계/문서가 훨씬 두꺼워 혼자 운영할 때 막히는 지점이 적다.

---

## 5. Auth & Storage — Supabase Auth / Supabase Storage (MVP)

**선택 이유**
- Supabase 하나로 DB+Auth+Storage를 묶으면 "관리해야 할 대시보드 개수"가 줄어든다. 이건 사소해 보이지만 1인 운영에서는 실제 비용이다.
- 이메일/비밀번호 + Google OAuth만 MVP에서 지원 (PRD 2.5).
- Storage에는 **템플릿 원본 PDF만** 올라간다 (생성된 문서는 서버에 안 옴 — PRD 9장 원칙). 용량이 작고 트래픽도 낮아 MVP 단계에선 Supabase Storage로 충분하다.

**V1+ 전환 조건**: 템플릿 파일 수/다운로드 트래픽이 커져서 Supabase Storage 비용(egress)이 부담되는 시점에 **Cloudflare R2**(egress 무료)로 스토리지만 이전한다. DB/Auth는 그대로 Supabase 유지 — 스토리지 계층만 교체 가능하게 인터페이스를 분리해서 구현한다.

---

## 6. Billing — Stripe

**선택 이유**
- 구독 결제, 인보이스, 실패 결제 재시도(dunning), 세금 처리까지 다 Stripe가 해준다. 이걸 직접 구현하는 건 1인 개발자에게 사업의 본질이 아닌 일에 시간을 쓰는 것이다.
- 카드 정보는 Stripe Checkout/Customer Portal에서 처리되므로 **PCI 컴플라이언스 부담이 우리 서버에 전혀 없다** (보안 우선 조건과 직결).
- Webhook(`/api/v1/webhooks/stripe`)으로 구독 상태를 DB에 동기화.

---

## 7. Logging & Monitoring

| 목적 | 도구 | 이유 |
|---|---|---|
| 에러 트래킹 | Sentry | 프론트+백엔드 동시 지원, 무료 티어로 MVP 충분 |
| 제품 분석 | PostHog | 이벤트 기반 분석 + 세션리플레이, self-host 옵션도 있어 나중에 비용 통제 가능 |
| 업타임 모니터링 | UptimeRobot / Better Stack | 무료 티어, 다운타임 알림 |
| 구조화 로그 | Fly.io 기본 로그 + 필요시 Axiom | MVP 단계에선 Fly 기본 로그로 충분, 트래픽 늘면 Axiom 연동 |

---

## 8. Queue & Worker — V1+에서만 도입 (MVP엔 없음)

**왜 MVP에는 없나**: 브라우저에서 생성하는 구조라 "줄 서서 처리할 무거운 작업"이 애초에 없다.

**V1+에 필요해지는 시점**: Shopify Webhook, 외부 API를 통한 무인 자동 생성처럼 "사람이 브라우저 앞에 없는" 케이스가 생기면, 그 순간부터 서버가 대신 PDF를 생성해줘야 한다.

- **Queue**: BullMQ + Upstash Redis (서버리스 Redis — 유휴 상태일 때 비용이 거의 안 나간다는 게 핵심. 1인 개발자가 "안 쓸 때도 돈 나가는 인프라"를 최소화하는 방향)
- **Worker**: 별도의 작은 Docker 컨테이너. 웹 서버(Next.js)와 동일한 `pdf-lib` 생성 로직을 공유 패키지로 재사용 (코드 중복 방지)
- 결과 파일은 R2/Supabase Storage에 **임시 저장 후 24시간 뒤 자동 삭제**(Lifecycle 정책) — PRD의 "서버에 문서를 오래 두지 않는다" 원칙을 서버사이드 케이스에도 동일하게 적용.

---

## 9. Deployment & CI/CD — Docker 기반, Fly.io

**선택 이유**
- 조건에 "Docker 기반"이 명시돼 있고, 실제로도 Vercel 같은 벤더 종속 빌드 시스템보다 Dockerfile 하나로 어디서든 옮길 수 있는 게 1인 개발자에게 유리하다 (특정 PaaS가 가격을 올리거나 서비스가 바뀌어도 마이그레이션 비용이 낮음).
- **Fly.io**를 1차 추천: Docker 이미지를 그대로 배포, 리전별 배포 지원(향후 글로벌 확장 시 유리), 저렴한 시작 비용, autoscaling 설정이 단순.
- CI/CD: GitHub Actions → 테스트/타입체크 → Docker 이미지 빌드 → Fly.io 배포. 하나의 워크플로 파일로 충분해서 유지보수 부담이 낮다.

**로컬 개발**: `docker-compose.yml`로 Postgres(로컬 테스트용)까지 포함해 프로덕션과 유사한 환경을 재현.

---

## 10. 보안 설계 요약

1. **데이터 최소 수집**: 실제 서류에 들어가는 민감정보(수하인 주소, 금액 등)는 브라우저에서만 처리되고 서버에 저장되지 않는다 — 이게 가장 강력한 보안 설계다. 데이터가 없으면 유출될 데이터도 없다.
2. **DB Row Level Security**: 조직 단위로 강제 격리.
3. **입력 검증**: 모든 API에 Zod 스키마, 업로드 파일은 MIME 타입/크기 화이트리스트.
4. **비밀 관리**: `.env`는 절대 커밋하지 않고, Fly.io Secrets / GitHub Actions Secrets로 관리.
5. **Rate Limiting**: 업로드·생성 엔드포인트에 Upstash Ratelimit 적용 (악용/과금 우회 방지).
6. **결제 데이터**: 카드 정보는 전혀 우리 서버를 거치지 않음(Stripe가 전담).

---

## 11. 10만 사용자(MAU)까지 확장 시나리오

이 서비스는 핵심 워크로드(PDF 생성)가 서버에 없기 때문에, 서버가 감당해야 하는 건 "가입/로그인/템플릿 CRUD/과금" 같은 가벼운 요청뿐이다. 그래서 확장 곡선이 일반적인 SaaS보다 훨씬 완만하다.

| 규모 | 구성 |
|---|---|
| 0~1천 MAU (MVP~초기) | Fly.io 단일 머신 1~2대 + Supabase Free/Pro |
| 1천~1만 MAU | Fly.io autoscaling(여러 머신), Supabase Pro, 필요시 Storage를 R2로 이전 |
| 1만~10만 MAU | 멀티 리전 배포, Redis 캐시(자주 조회되는 템플릿 메타데이터), DB Read Replica, Cloudflare CDN으로 정적 자산 캐싱 |
| Enterprise 물량 증가 시 | 서버사이드 생성 Worker 플릿을 웹 서버와 별도로 독립 스케일 |

가장 먼저 막힐 지점은 서버 CPU가 아니라 **DB 커넥션 수**와 **템플릿 파일 다운로드 트래픽**일 가능성이 높다 — 둘 다 매니지드 서비스(Supabase pooler, R2 CDN)로 초기부터 완화되도록 설계했다.

---

## 12. 향후 AI 기능을 붙이는 지점 (지금은 안 씀, 구조만 열어둠)

PRD에서 명시했듯 MVP는 AI를 전혀 쓰지 않는다(딕셔너리 매칭으로 충분). 하지만 나중에 이런 지점에 자연스럽게 끼워 넣을 수 있게 설계했다:

- **필드 자동 인식**: `POST /templates/:id/ai-suggest-fields` — 템플릿 업로드 시 1회만 호출(Claude Vision 등에 PDF 이미지 전달 → 필드 좌표 추정) → 매핑 스튜디오에 미리 채워줌. 반복 생성 시엔 호출 안 함 → 비용 통제 원칙(PRD) 그대로 유지.
- **CSV 컬럼 매칭 실패 시 폴백**: 딕셔너리로 못 찾은 컬럼만 LLM에 물어봄 (역시 1회성).
- 두 기능 모두 기존 REST 구조에 엔드포인트 하나 추가하는 정도라 아키텍처 재설계가 필요 없다.

---

## 13. 기술 선택 요약표

| 영역 | 선택 | 핵심 이유 |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind | SEO 페이지 대량 생성 + 클라이언트 PDF 엔진과 자연스럽게 결합 |
| Backend | Next.js Route Handlers (모놀리스) | 배포 대상 최소화, 1인 유지보수 |
| DB | PostgreSQL (Supabase) | 관계형 데이터 + RLS 보안 + 매니지드 운영 |
| ORM | Prisma | 타입 안전 + 성숙한 마이그레이션/디버깅 툴 |
| Auth | Supabase Auth | Google OAuth + 이메일, 별도 서비스 불필요 |
| Storage | Supabase Storage → (V1+) Cloudflare R2 | MVP는 단순함 우선, 트래픽 늘면 egress-free로 전환 |
| Billing | Stripe | PCI 부담 제거, 구독/인보이스 자동화 |
| Queue/Worker | (V1+) BullMQ + Upstash Redis | 무인 자동화(Shopify/API)에서만 필요, 유휴비용 최소 |
| Deployment | Docker + Fly.io | 벤더 종속 낮음, Docker 조건 충족, 리전 확장 용이 |
| CI/CD | GitHub Actions | 단일 워크플로, 관리 부담 낮음 |
| Monitoring | Sentry + PostHog + UptimeRobot | 무료 티어로 MVP 전부 커버 |
| AI (향후) | Claude Vision API (선택적 호출) | 1회성 호출 지점만 열어둠, MVP에는 미포함 |
