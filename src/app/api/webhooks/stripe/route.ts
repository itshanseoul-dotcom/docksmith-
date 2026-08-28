import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, planFromPriceId } from "@/lib/stripe";
import { logError } from "@/lib/error-log";

export const runtime = "nodejs";

// Stripe 구독 객체 자체에는 청구 기간 정보가 없다 — Subscription Item 쪽에 있다
// (Stripe API가 여러 아이템/여러 청구 주기를 지원하도록 바뀌면서 이렇게 됐다).
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000) : null;
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      planTier: isActive && plan ? plan : "FREE",
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      currentPeriodEnd: getCurrentPeriodEnd(subscription),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) return;

  await prisma.organization.update({
    where: { id: organizationId },
    data: { planTier: "FREE", stripeSubscriptionStatus: "canceled" },
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "missing stripe-signature header or STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    await logError({
      source: "server",
      message: err instanceof Error ? err.message : "stripe webhook handling failed",
      stack: err instanceof Error ? (err.stack ?? null) : null,
      url: request.url,
    });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
