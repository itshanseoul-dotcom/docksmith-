import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
        <CardFooter>
          <form action={acceptInvite.bind(null, token)}>
            <Button type="submit">참여하기</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
