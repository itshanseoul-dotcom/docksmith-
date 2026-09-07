import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addOneMonth,
  isScheduledPaymentId,
  makePaymentId,
  orderName,
  organizationIdFromPaymentId,
} from "./portone";

describe("makePaymentId / organizationIdFromPaymentId", () => {
  it("round-trips the organization id for an initial payment", () => {
    const paymentId = makePaymentId("initial", "org_abc123");
    expect(paymentId).toMatch(/^init-org_abc123-\d+$/);
    expect(organizationIdFromPaymentId(paymentId)).toBe("org_abc123");
  });

  it("round-trips the organization id for a scheduled payment", () => {
    const paymentId = makePaymentId("scheduled", "org_xyz789");
    expect(paymentId).toMatch(/^sched-org_xyz789-\d+$/);
    expect(organizationIdFromPaymentId(paymentId)).toBe("org_xyz789");
  });

  it("returns null for a paymentId with an unrecognized prefix", () => {
    expect(organizationIdFromPaymentId("stripe-org_abc123-123")).toBeNull();
  });
});

describe("isScheduledPaymentId", () => {
  it("is true only for scheduled-prefixed payment ids", () => {
    expect(isScheduledPaymentId(makePaymentId("scheduled", "org_1"))).toBe(true);
    expect(isScheduledPaymentId(makePaymentId("initial", "org_1"))).toBe(false);
  });
});

describe("orderName", () => {
  it("includes the plan tier", () => {
    expect(orderName("STARTER")).toBe("Docksmith STARTER 요금제");
    expect(orderName("PRO")).toBe("Docksmith PRO 요금제");
  });
});

describe("addOneMonth", () => {
  it("advances a mid-month date by one month", () => {
    const result = addOneMonth(new Date(2026, 8, 7)); // 2026-09-07
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(9); // October
    expect(result.getDate()).toBe(7);
  });

  it("clamps to the last day of a shorter next month (Jan 31 -> Feb 28, non-leap)", () => {
    const result = addOneMonth(new Date(2027, 0, 31)); // 2027-01-31 (2027 is not a leap year)
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(28);
  });

  it("clamps to Feb 29 in a leap year", () => {
    const result = addOneMonth(new Date(2028, 0, 31)); // 2028-01-31 (2028 is a leap year)
    expect(result.getFullYear()).toBe(2028);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(29);
  });

  it("clamps a 31st to the 30th when the next month has only 30 days", () => {
    const result = addOneMonth(new Date(2026, 2, 31)); // 2026-03-31
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(30);
  });
});

describe("getPortOneClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws a clear error when PORTONE_API_SECRET is missing", async () => {
    vi.stubEnv("PORTONE_API_SECRET", "");
    const { getPortOneClient } = await import("./portone");

    expect(() => getPortOneClient()).toThrow(/PORTONE_API_SECRET/);
  });
});
