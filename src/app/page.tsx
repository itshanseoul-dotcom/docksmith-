import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-end gap-4 p-4">
        <Link
          href="/pricing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          요금제
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          로그인
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Docksmith</h1>
        <p className="max-w-md text-muted-foreground">
          쓰던 PDF/Word/Excel 양식에 필드만 한 번 표시해두면, 다음부터는 CSV만 올려서
          수백 장을 한 번에 만듭니다.
        </p>
        <Link href="/login" className={buttonVariants({ variant: "default", size: "lg" })}>
          무료로 시작하기
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
