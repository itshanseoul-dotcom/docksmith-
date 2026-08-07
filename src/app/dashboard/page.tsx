import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">환영합니다, {user.email}</h1>
      <p className="max-w-md text-muted-foreground">
        대시보드 화면은 ROADMAP 1.7 단계에서 만들어집니다. 지금은 로그인이
        정상 동작하는지 확인하는 자리입니다.
      </p>
      <form action={logout}>
        <Button variant="outline" type="submit">
          로그아웃
        </Button>
      </form>
    </div>
  );
}
