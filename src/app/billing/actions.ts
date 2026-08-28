"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireOwnerMembership } from "@/lib/membership";
import { getStripeClient, getPriceId, type CheckoutPlan } from "@/lib/stripe";

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
