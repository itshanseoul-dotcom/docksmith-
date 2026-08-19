import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logout } from "@/app/login/actions";
import { createSampleTemplate } from "./actions";
import { getMonthlyUsage, MONTHLY_FREE_LIMIT } from "@/lib/usage";

const JOB_STATUS_LABEL: Record<string, string> = {
  PENDING: "대기 중",
  PROCESSING: "처리 중",
  COMPLETED: "완료",
  FAILED: "실패",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sampleError?: string }>;
}) {
  const { sampleError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { ownerAuthUserId: user.id },
  });

  const [templates, jobs, usedThisMonth] = organization
    ? await Promise.all([
        prisma.template.findMany({
          where: { organizationId: organization.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.generationJob.findMany({
          where: { template: { organizationId: organization.id } },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { template: { select: { name: true } } },
        }),
        getMonthlyUsage(organization.id),
      ])
    : [[], [], 0];

  const usagePercent = Math.min(100, (usedThisMonth / MONTHLY_FREE_LIMIT) * 100);
  const usageBarColor = usagePercent >= 80 ? "bg-destructive" : "bg-primary";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">대시보드</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={logout}>
          <Button variant="outline" type="submit">
            로그아웃
          </Button>
        </form>
      </header>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">이번 달 사용량</span>
          <span className="text-muted-foreground">
            {usedThisMonth}/{MONTHLY_FREE_LIMIT}건 (무료)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${usageBarColor}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">내 템플릿</h2>
          <Link href="/templates/new" className={buttonVariants({ variant: "default" })}>
            새 템플릿 만들기
          </Link>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                아직 템플릿이 없습니다. 첫 템플릿을 만들어보세요.
              </p>
              {sampleError && (
                <p className="text-sm text-destructive">
                  샘플 템플릿을 만드는 중 문제가 발생했습니다. 다시 시도해주세요.
                </p>
              )}
              <Link href="/templates/new" className={buttonVariants({ variant: "default" })}>
                새 템플릿 만들기
              </Link>
              <div className="flex items-center gap-3">
                <form action={createSampleTemplate}>
                  <button
                    type="submit"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    샘플로 체험하기
                  </button>
                </form>
                <span className="text-muted-foreground">·</span>
                <a
                  href="/samples/sample-commercial-invoice.csv"
                  download
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  샘플 CSV 다운로드
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="truncate">{template.name}</CardTitle>
                  <CardDescription>{template.pageCount}페이지</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link
                    href={`/templates/${template.id}/generate`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    생성하기
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">최근 생성 이력</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 생성 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">템플릿</th>
                  <th className="py-2 pr-4">파일</th>
                  <th className="py-2 pr-4">건수</th>
                  <th className="py-2 pr-4">상태</th>
                  <th className="py-2">시각</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b">
                    <td className="py-2 pr-4">{job.template.name}</td>
                    <td className="py-2 pr-4">{job.sourceFileName}</td>
                    <td className="py-2 pr-4">{job.rowCount}건</td>
                    <td className="py-2 pr-4">
                      {JOB_STATUS_LABEL[job.status] ?? job.status}
                    </td>
                    <td className="py-2">{job.createdAt.toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
