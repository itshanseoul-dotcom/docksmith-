"use server";

import { createClient } from "@/lib/supabase/server";
import { getMembershipForUser } from "@/lib/membership";
import { logError } from "@/lib/error-log";

export async function logClientError(input: {
  message: string;
  stack?: string | null;
  digest?: string | null;
  url?: string | null;
}) {
  // best-effort — 로그인 안 된 화면(랜딩페이지 등)에서 난 에러도 기록해야 하니
  // 사용자/조직을 못 찾아도 실패시키지 않는다.
  let organizationId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const membership = await getMembershipForUser(user.id);
      organizationId = membership?.organizationId ?? null;
    }
  } catch {
    // 무시 — 조직 컨텍스트 없이라도 에러 자체는 기록한다.
  }

  await logError({ source: "client", ...input, organizationId });
}
