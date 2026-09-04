import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "@portone/server-sdk";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICE_KRW } from "@/lib/usage";
import { logError } from "@/lib/error-log";
import {
  getPortOneClient,
  orderName,
  makePaymentId,
  addOneMonth,
  organizationIdFromPaymentId,
  isScheduledPaymentId,
} from "@/lib/portone";

export const runtime = "nodejs";

// 정기결제 2회차 이후는 포트원 결제 예약(paymentSchedule)이 스스로 청구일에 실행한다
// (크론 불필요). 매 회차가 "1회성 예약"이라, 결제가 성공할 때마다 이 웹훅에서
// 다음 달 예약을 새로 만들어야 결제가 계속 이어진다(롤링 스케줄).
async function handlePaid(paymentId: string) {
  if (!isScheduledPaymentId(paymentId)) return; // 최초 결제는 서버 액션이 이미 다음 회차를 예약함

  const organizationId = organizationIdFromPaymentId(paymentId);
  if (!organizationId) return;

  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization || !organization.portoneBillingKey) return;

  const price = PLAN_PRICE_KRW[organization.planTier];
  if (price === 0) return;

  const name = orderName(organization.planTier);
  const nextChargeAt = addOneMonth(organization.currentPeriodEnd ?? new Date());

  const client = getPortOneClient();
  try {
    await client.payment.paymentSchedule.createPaymentSchedule({
      paymentId: makePaymentId("scheduled", organizationId),
      payment: {
        billingKey: organization.portoneBillingKey,
        orderName: name,
        amount: { total: price },
        currency: "KRW",
        customer: {},
      },
      timeToPay: nextChargeAt.toISOString(),
    });
  } catch (err) {
    await logError({
      source: "server",
      message: `PortOne 다음 결제 예약 실패(웹훅): ${err instanceof Error ? err.message : String(err)}`,
      stack: err instanceof Error ? (err.stack ?? null) : null,
      organizationId,
    });
    return;
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { currentPeriodEnd: nextChargeAt },
  });
}

async function handleFailed(paymentId: string) {
  if (!isScheduledPaymentId(paymentId)) return; // 최초 결제 실패는 서버 액션이 이미 처리함

  const organizationId = organizationIdFromPaymentId(paymentId);
  if (!organizationId) return;

  await prisma.organization.update({
    where: { id: organizationId },
    data: { planTier: "FREE", currentPeriodEnd: null },
  });

  await logError({
    source: "server",
    message: `PortOne 정기결제 실패로 Free 플랜으로 전환됨 (paymentId: ${paymentId})`,
    organizationId,
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "missing PORTONE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let webhook: Awaited<ReturnType<typeof Webhook.verify>>;
  try {
    webhook = await Webhook.verify(secret, rawBody, headers);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (webhook.type) {
      case "Transaction.Paid":
        await handlePaid(webhook.data.paymentId);
        break;
      case "Transaction.Failed":
        await handleFailed(webhook.data.paymentId);
        break;
      default:
        break;
    }
  } catch (err) {
    await logError({
      source: "server",
      message: err instanceof Error ? err.message : "portone webhook handling failed",
      stack: err instanceof Error ? (err.stack ?? null) : null,
      url: request.url,
    });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
