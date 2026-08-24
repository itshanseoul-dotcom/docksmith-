import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, isSoleOwnerOfOtherOrg } from "@/lib/membership";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { acceptInvite } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "소유자",
  ADMIN: "관리자",
  MEMBER: "멤버",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invite || invite.acceptedAt) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>유효하지 않은 초대 링크</CardTitle>
            <CardDescription>
              이미 사용됐거나 취소된 링크입니다. 초대한 사람에게 새 링크를 요청해주세요.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{invite.organization.name} 팀 초대</CardTitle>
            <CardDescription>
              {ROLE_LABEL[invite.role] ?? invite.role}로 참여하도록 초대받았습니다. 먼저
              로그인한 뒤 이 링크를 다시 열어주세요.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className={buttonVariants({ variant: "default" })}>
              로그인 / 가입
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const membership = await getMembershipForUser(user.id);
  const risksOrphaningOwnOrg = await isSoleOwnerOfOtherOrg(membership, invite.organizationId);
  const currentOrgName = membership
    ? (await prisma.organization.findUnique({ where: { id: membership.organizationId } }))
        ?.name
    : null;

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{invite.organization.name} 팀 초대</CardTitle>
          <CardDescription>
            {ROLE_LABEL[invite.role] ?? invite.role}로 참여합니다. 지금 속한 조직이 있다면
            이 조직으로 옮겨집니다.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {risksOrphaningOwnOrg && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium">주의: 지금 &quot;{currentOrgName}&quot;의 유일한 소유자입니다.</p>
              <p className="mt-1 text-xs">
                참여하면 그 조직에서 완전히 빠지게 되고, 소유자가 없어져서 이후로는
                아무도 그 조직의 멤버·API 키·웹훅을 관리할 수 없습니다.
              </p>
            </div>
          )}
          {error === "confirm_required" && (
            <p className="text-xs text-destructive">
              체크박스를 선택해야 참여할 수 있습니다.
            </p>
          )}
          <form
            action={acceptInvite.bind(null, token)}
            className="flex flex-col items-stretch gap-2"
          >
            {risksOrphaningOwnOrg && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="confirmLeave" required className="mt-0.5" />
                이해했습니다. &quot;{currentOrgName}&quot;의 소유권을 포기하고 참여합니다.
              </label>
            )}
            <Button type="submit">참여하기</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
