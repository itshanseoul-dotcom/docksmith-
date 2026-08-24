import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button, buttonVariants } from "@/components/ui/button";
import { createInvite, revokeInvite, removeMember } from "./actions";
import { revokeApiKey } from "./api-key-actions";
import { ApiKeyForm } from "./api-key-form";
import { deleteWebhook, toggleWebhook, sendTestWebhook } from "./webhook-actions";
import { WebhookForm } from "./webhook-form";

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

  const [members, invites, apiKeys, webhooks] = await Promise.all([
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
    isOwner
      ? prisma.apiKey.findMany({
          where: { organizationId: membership.organizationId, revokedAt: null },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    isOwner
      ? prisma.webhook.findMany({
          where: { organizationId: membership.organizationId },
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

      {isOwner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">공개 API 키</h2>
          <p className="text-xs text-muted-foreground">
            다른 프로그램이 사람 없이 직접 문서를 생성하게 하고 싶을 때 씁니다. 한 번
            호출당 최대 25행, 이번 달 무료 한도는 브라우저 생성과 공유됩니다.
          </p>
          <ApiKeyForm />

          {apiKeys.length > 0 && (
            <ul className="flex flex-col gap-2">
              {apiKeys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {key.keyPrefix}… ·{" "}
                      {key.lastUsedAt
                        ? `마지막 사용 ${key.lastUsedAt.toLocaleString("ko-KR")}`
                        : "아직 사용 안 함"}
                    </p>
                  </div>
                  <form action={revokeApiKey.bind(null, key.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      폐기
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <details className="rounded-lg border p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">사용법 보기</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-2">
              {`curl -X POST ${origin}/api/v1/templates/TEMPLATE_ID/generate \\
  -H "Authorization: Bearer dk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"rows":[{"invoice_no":"INV-001"}]}' \\
  -o results.zip`}
            </pre>
          </details>
        </section>
      )}

      {isOwner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">웹훅</h2>
          <p className="text-xs text-muted-foreground">
            문서 생성이 끝날 때마다(브라우저·API 둘 다) 지정한 주소로 알려드립니다.
            Zapier의 &quot;Webhooks by Zapier&quot; 트리거, Make의 Webhooks 모듈 등에
            바로 연결할 수 있습니다. 재시도는 하지 않고 한 번만 보냅니다.
          </p>
          <WebhookForm />

          {webhooks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {webhooks.map((webhook) => (
                <li key={webhook.id} className="flex flex-col gap-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="break-all text-sm font-medium">{webhook.url}</p>
                    <span
                      className={`shrink-0 text-xs ${
                        webhook.active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {webhook.active ? "켜짐" : "꺼짐"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    서명 검증용 secret:{" "}
                    <code className="rounded bg-muted px-1">{webhook.secret}</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {webhook.lastTriggeredAt
                      ? `마지막 전송 ${webhook.lastTriggeredAt.toLocaleString("ko-KR")} · 상태 ${
                          webhook.lastStatus ?? "실패(응답 없음)"
                        }`
                      : "아직 전송된 적 없음"}
                  </p>
                  <div className="flex gap-2">
                    <form action={sendTestWebhook.bind(null, webhook.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        테스트 이벤트 보내기
                      </Button>
                    </form>
                    <form action={toggleWebhook.bind(null, webhook.id, !webhook.active)}>
                      <Button type="submit" variant="outline" size="sm">
                        {webhook.active ? "끄기" : "켜기"}
                      </Button>
                    </form>
                    <form action={deleteWebhook.bind(null, webhook.id)}>
                      <Button type="submit" variant="destructive" size="sm">
                        삭제
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
