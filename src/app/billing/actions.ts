"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireOwnerMembership } from "@/lib/membership";
import { getStripeClient, getPriceId, type CheckoutPlan } from "@/lib/stripe";
import {
  getPortOneClient,
  orderName,
  makePaymentId,
  addOneMonth,
  type SubscribablePlan,
} from "@/lib/portone";
import { PLAN_PRICE_KRW } from "@/lib/usage";
import { logError } from "@/lib/error-log";

async function getOrigin(): Promise<string> {
  return (await headers()).get("origin") ?? "https://docksmith.vercel.app";
}

export async function createCheckoutSession(plan: CheckoutPlan) {
  const membership = await requireOwnerMembership();
  if (!membership) {
    redirect("/billing?error=owner_only");
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: membership.organizationId },
  });

  const stripe = getStripeClient();
  const origin = await getOrigin();

  // 카드 정보는 우리 서버를 거치지 않는다 — Stripe Checkout(호스팅 페이지)으로
  // 리다이렉트만 시킨다.
  let customerId = organization.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: membership.email,
      metadata: { organizationId: organization.id },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: organization.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    success_url: `${origin}/billing?success=1`,
    cancel_url: `${origin}/billing?canceled=1`,
    subscription_data: { metadata: { organizationId: organization.id } },
  });

  if (!session.url) {
    redirect("/billing?error=checkout_failed");
  }
  redirect(session.url);
}

// 포트원(카드 빌링키)으로 신규 구독을 시작한다: 최초 결제를 즉시 처리하고,
// 다음 달 결제를 예약한 뒤 플랜을 반영한다. 카드 정보는 포트원 위젯이 직접
// 받으므로 여기서는 결제가 끝난 뒤 발급된 billingKey만 받는다.
export async function activatePortOneBilling(
  plan: SubscribablePlan,
  billingKey: string
): Promise<{ error: string } | void> {
  const membership = await requireOwnerMembership();
  if (!membership) {
    return { error: "조직 소유자만 요금제를 변경할 수 있습니다." };
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: membership.organizationId },
  });

  const client = getPortOneClient();
  const price = PLAN_PRICE_KRW[plan];
  const name = orderName(plan);
  const customer = { email: membership.email };

  try {
    await client.payment.payWithBillingKey({
      paymentId: makePaymentId("initial", organization.id),
      billingKey,
      orderName: name,
      amount: { total: price },
      currency: "KRW",
      customer,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "결제에 실패했습니다." };
  }

  const nextChargeAt = addOneMonth(new Date());
  try {
    await client.payment.paymentSchedule.createPaymentSchedule({
      paymentId: makePaymentId("scheduled", organization.id),
      payment: { billingKey, orderName: name, amount: { total: price }, currency: "KRW", customer },
      timeToPay: nextChargeAt.toISOString(),
    });
  } catch (err) {
    // 최초 결제는 성공했으니 여기서 막지 않는다 — 다음 회차 예약 실패는 기록만 남긴다.
    await logError({
      source: "server",
      message: `PortOne 다음 결제 예약 실패: ${err instanceof Error ? err.message : String(err)}`,
      stack: err instanceof Error ? (err.stack ?? null) : null,
      organizationId: organization.id,
    });
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: { planTier: plan, portoneBillingKey: billingKey, currentPeriodEnd: nextChargeAt },
  });

  redirect("/billing?success=1");
}

export async function cancelPortOneSubscription() {
  const membership = await requireOwnerMembership();
  if (!membership) {
    redirect("/billing?error=owner_only");
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: membership.organizationId },
  });

  if (organization.portoneBillingKey) {
    try {
      const client = getPortOneClient();
      await client.payment.paymentSchedule.revokePaymentSchedules({
        billingKey: organization.portoneBillingKey,
      });
    } catch (err) {
      await logError({
        source: "server",
        message: `PortOne 구독 해지(예약 취소) 실패: ${err instanceof Error ? err.message : String(err)}`,
        stack: err instanceof Error ? (err.stack ?? null) : null,
        organizationId: organization.id,
      });
    }
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: { planTier: "FREE", portoneBillingKey: null, currentPeriodEnd: null },
  });

  redirect("/billing?canceled=1");
}

export async function createBillingPortalSession() {
  const membership = await requireOwnerMembership();
  if (!membership) {
    redirect("/billing?error=owner_only");
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: membership.organizationId },
  });

  if (!organization.stripeCustomerId) {
    redirect("/billing?error=no_subscription");
  }

  const stripe = getStripeClient();
  const origin = await getOrigin();

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${origin}/billing`,
  });

  redirect(session.url);
}
