import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button, buttonVariants } from "@/components/ui/button";
import { createInvite, revokeInvite, removeMember } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "소유자",
  ADMIN: "관리자",
  MEMBER: "멤버",
};

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.membership.findUnique({
    where: { authUserId: user.id },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const isOwner = membership.role === "OWNER";

  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "asc" },
    }),
    isOwner
      ? prisma.organizationInvite.findMany({
          where: { organizationId: membership.organizationId, acceptedAt: null },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const origin = (await headers()).get("origin");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">팀 관리</h1>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
          대시보드로 돌아가기
        </Link>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">멤버 ({members.length})</h2>
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="text-sm font-medium">{m.email}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABEL[m.role] ?? m.role}
                </p>
              </div>
              {isOwner && m.id !== membership.id && (
                <form action={removeMember.bind(null, m.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    제거
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">새 멤버 초대</h2>
          <p className="text-xs text-muted-foreground">
            이메일 발송 없이 링크를 만들어서 직접 전달하는 방식입니다. 링크를 받은 사람이
            로그인 후 열면 팀에 합류합니다.
          </p>
          <form action={createInvite} className="flex items-center gap-2">
            <select
              name="role"
              defaultValue="MEMBER"
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="MEMBER">멤버</option>
              <option value="ADMIN">관리자</option>
            </select>
            <Button type="submit" size="sm">
              초대 링크 만들기
            </Button>
          </form>

          {invites.length > 0 && (
            <ul className="flex flex-col gap-2">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABEL[invite.role] ?? invite.role}로 초대 · 아직 미수락
                    </p>
                    <input
                      readOnly
                      value={`${origin}/invite/${invite.token}`}
                      className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs sm:w-80"
                    />
                  </div>
                  <form action={revokeInvite.bind(null, invite.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      취소
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
