-- Supabase Storage 버킷/정책은 Prisma가 관리하는 public 스키마 밖이라 마이그레이션에
-- 포함되지 않는다. 새 Supabase 프로젝트를 셋업할 때 이 파일을 SQL Editor에서 한 번 실행한다.
-- (ROADMAP 1.3 — 템플릿 원본 PDF 저장용)

insert into storage.buckets (id, name, public)
values ('templates', 'templates', false)
on conflict (id) do nothing;

-- 경로 규칙: templates/{auth.uid()}/{파일명} — 폴더의 첫 세그먼트로 소유자를 강제한다.
-- MVP는 1계정=1org라 auth.uid() 기준 격리로 충분하다 (ROADMAP.md).
create policy "Users can upload their own templates"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'templates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read their own templates"
on storage.objects for select
to authenticated
using (
  bucket_id = 'templates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own templates"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'templates'
  and (storage.foldername(name))[1] = auth.uid()::text
);
