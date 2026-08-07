import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component에서 호출되면 쿠키를 쓸 수 없어 setAll이 실패한다.
// 세션 자체는 proxy.ts가 매 요청마다 갱신해주므로 여기서는 무시해도 된다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 — 무시 (위 주석 참고)
          }
        },
      },
    }
  );
}
