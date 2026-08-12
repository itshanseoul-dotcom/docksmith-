-- Supabase는 public 스키마 테이블을 기본적으로 PostgREST(anon/publishable key로 접근 가능한
-- REST API)에 노출한다. 이 앱은 그 API를 쓰지 않고 서버에서 Prisma로 직접 연결(postgres
-- 소유자 권한, RLS 영향 안 받음)만 쓰므로, RLS를 켜고 정책을 아예 안 주면 REST API 경로는
-- 막히고 Prisma 경로는 그대로 동작한다. (Supabase Security Advisor: rls_disabled_in_public)

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "template_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generation_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generation_job_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "column_alias_dictionary" ENABLE ROW LEVEL SECURITY;
