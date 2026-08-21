import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button, buttonVariants } from "@/components/ui/button";
import { restoreTemplateFieldVersion } from "./actions";

export default async function TemplateVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const template = await prisma.template.findFirst({
    where: { id, organization: { ownerAuthUserId: user.id } },
  });

  if (!template) {
    notFound();
  }

  const versions = await prisma.templateFieldVersion.findMany({
    where: { templateId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{template.name} — 버전 기록</h1>
        <Link
          href={`/templates/${id}/mapping`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          매핑으로 돌아가기
        </Link>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 저장된 버전이 없습니다. 매핑 스튜디오에서 저장하면 여기 기록됩니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {versions.map((v, i) => {
            const fieldCount = Array.isArray(v.fields) ? v.fields.length : 0;
            return (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {i === 0 ? "현재 버전" : "이전 버전"} · 필드 {fieldCount}개
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.createdAt.toLocaleString("ko-KR")}
                  </p>
                </div>
                {i !== 0 && (
                  <form action={restoreTemplateFieldVersion.bind(null, id, v.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      이 버전으로 복구
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
