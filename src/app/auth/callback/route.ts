import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/organization";

// Google OAuth 리다이렉트가 돌아오는 지점. code를 세션으로 교환하고 org를 보장한 뒤 대시보드로 보낸다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureOrganization(data.user.id, data.user.email ?? data.user.id);
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
