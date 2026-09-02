import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMembershipForUser, canManageMembers } from "@/lib/membership";
import { getMonthlyUsage, PLAN_LABEL, PLAN_LIMITS, PLAN_PRICE_KRW } from "@/lib/usage";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCheckoutSession, createBillingPortalSession } from "./actions";
import { SiteFooter } from "@/components/site-footer";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
}) {
  const { success, canceled, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getMembershipForUser(user.id);
  if (!membership) {
    redirect("/dashboard");
  }

  const [organization, usedThisMonth] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: membership.organizationId } }),
    getMonthlyUsage(membership.organizationId),
  ]);

  const isOwner = canManageMembers(membership.role);
  const monthlyLimit = PLAN_LIMITS[organization.planTier];
  const hasSubscription = organization.stripeSubscriptionId !== null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">요금제</h1>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
          대시보드로 돌아가기
        </Link>
      </div>

      {success && (
        <p className="text-sm text-primary">
          결제가 완료됐습니다. 플랜 반영까지 몇 초 걸릴 수 있습니다.
        </p>
      )}
      {canceled && <p className="text-sm text-muted-foreground">결제를 취소했습니다.</p>}
      {error && <p className="text-sm text-destructive">문제가 발생했습니다: {error}</p>}

      <section className="rounded-lg border p-4">
        <p className="text-sm font-medium">현재 플랜: {PLAN_LABEL[organization.planTier]}</p>
        <p className="text-sm text-muted-foreground">
          이번 달 사용량: {usedThisMonth}
          {monthlyLimit === null ? "건 (무제한)" : `/${monthlyLimit}건`}
        </p>
        {organization.stripeSubscriptionStatus && (
          <p className="text-xs text-muted-foreground">
            구독 상태: {organization.stripeSubscriptionStatus}
            {organization.currentPeriodEnd &&
              ` · 다음 결제일 ${organization.currentPeriodEnd.toLocaleDateString("ko-KR")}`}
          </p>
        )}
      </section>

      {!isOwner ? (
        <p className="text-sm text-muted-foreground">
          요금제 변경은 조직 소유자만 할 수 있습니다.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["FREE", "STARTER", "PRO"] as const).map((plan) => (
              <Card key={plan} className={organization.planTier === plan ? "ring-primary/40" : ""}>
                <CardHeader>
                  <CardTitle>{PLAN_LABEL[plan]}</CardTitle>
                  <CardDescription>
                    {PLAN_PRICE_KRW[plan] === 0
                      ? "무료"
                      : `${PLAN_PRICE_KRW[plan].toLocaleString("ko-KR")}원/월`}{" "}
                    · {PLAN_LIMITS[plan] === null ? "무제한" : `월 ${PLAN_LIMITS[plan]}건`}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  {plan === "FREE" ? (
                    <Button disabled variant="outline" size="sm">
                      기본 플랜
                    </Button>
                  ) : organization.planTier === plan ? (
                    <Button disabled size="sm">
                      현재 플랜
                    </Button>
                  ) : (
                    <form action={createCheckoutSession.bind(null, plan)}>
                      <Button type="submit" size="sm">
                        선택하기
                      </Button>
                    </form>
                  )}
                </CardFooter>
              </Card>
            ))}
          </section>

          {hasSubscription && (
            <form action={createBillingPortalSession}>
              <Button type="submit" variant="outline">
                구독 관리 (결제수단 변경 / 해지)
              </Button>
            </form>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Team 플랜({PLAN_PRICE_KRW.TEAM.toLocaleString("ko-KR")}원/월, 팀 공유·다수 시트)은
        준비 중입니다.
      </p>

      <SiteFooter />
    </div>
  );
}
