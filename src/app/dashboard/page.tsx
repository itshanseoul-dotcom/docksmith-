import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { uploaded } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">환영합니다, {user.email}</h1>
      <p className="max-w-md text-muted-foreground">
        대시보드 화면은 ROADMAP 1.7 단계에서 만들어집니다. 지금은 인증과
        템플릿 업로드가 정상 동작하는지 확인하는 자리입니다.
      </p>
      {uploaded && (
        <p className="text-sm text-emerald-600">템플릿이 업로드되었습니다.</p>
      )}
      <div className="flex gap-2">
        <Link href="/templates/new" className={buttonVariants({ variant: "default" })}>
          새 템플릿 업로드
        </Link>
        <form action={logout}>
          <Button variant="outline" type="submit">
            로그아웃
          </Button>
        </form>
      </div>
    </div>
  );
}
