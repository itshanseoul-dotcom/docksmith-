import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLAN_LABEL, PLAN_LIMITS, PLAN_PRICE_KRW } from "@/lib/usage";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "요금제 | Docksmith",
};

const PLAN_DESCRIPTION: Record<"FREE" | "STARTER" | "PRO" | "TEAM", string> = {
  FREE: "가볍게 사용해보기 좋은 무료 플랜입니다.",
  STARTER: "정기적으로 문서를 생성하는 1인 사용자를 위한 플랜입니다.",
  PRO: "대량 생성이 필요한 개인·소규모 팀을 위한 플랜입니다.",
  TEAM: "팀원과 템플릿을 공유하는 팀을 위한 플랜입니다.",
};

export default function PricingPage() {
  const plans = ["FREE", "STARTER", "PRO", "TEAM"] as const;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">요금제</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          홈으로
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        PDF/Word/Excel 문서 자동 생성 서비스 Docksmith의 요금제입니다. 모든 결제는
        매월 자동 갱신되며 언제든지 해지할 수 있습니다.
      </p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan}>
            <CardHeader>
              <CardTitle>{PLAN_LABEL[plan]}</CardTitle>
              <CardDescription>
                {PLAN_PRICE_KRW[plan] === 0
                  ? "무료"
                  : `${PLAN_PRICE_KRW[plan].toLocaleString("ko-KR")}원/월`}{" "}
                · {PLAN_LIMITS[plan] === null ? "월 생성 무제한" : `월 ${PLAN_LIMITS[plan]}건`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">{PLAN_DESCRIPTION[plan]}</p>
              {plan === "TEAM" ? (
                <span className="text-xs text-muted-foreground">준비 중</span>
              ) : (
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  시작하기
                </Link>
              )}
            </CardFooter>
          </Card>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
