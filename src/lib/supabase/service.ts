import "server-only";
import { createClient } from "@supabase/supabase-js";

// API 키 요청은 Supabase Auth 세션(쿠키)이 없다 — org 소유 여부는 이미 ApiKey로
// 확인했으므로, Storage RLS를 우회해서 그 org의 템플릿 파일을 직접 읽어야 한다.
// service_role 키는 이 파일 밖으로 절대 내보내면 안 된다.
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local에 추가해주세요."
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
