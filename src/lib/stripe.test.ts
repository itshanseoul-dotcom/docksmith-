import { afterEach, describe, expect, it, vi } from "vitest";

describe("getPriceId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns the configured price id for a plan", async () => {
    vi.stubEnv("STRIPE_PRICE_STARTER", "price_abc");
    vi.stubEnv("STRIPE_PRICE_PRO", "price_def");
    const { getPriceId } = await import("./stripe");

    expect(getPriceId("STARTER")).toBe("price_abc");
    expect(getPriceId("PRO")).toBe("price_def");
  });

  it("throws a clear error when the env var is missing", async () => {
    vi.stubEnv("STRIPE_PRICE_STARTER", "");
    const { getPriceId } = await import("./stripe");

    expect(() => getPriceId("STARTER")).toThrow(/STRIPE_PRICE_STARTER/);
  });
});

describe("planFromPriceId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("maps a known price id back to its plan tier", async () => {
    vi.stubEnv("STRIPE_PRICE_STARTER", "price_abc");
    vi.stubEnv("STRIPE_PRICE_PRO", "price_def");
    const { planFromPriceId } = await import("./stripe");

    expect(planFromPriceId("price_abc")).toBe("STARTER");
    expect(planFromPriceId("price_def")).toBe("PRO");
  });

  it("returns null for an unrecognized price id", async () => {
    vi.stubEnv("STRIPE_PRICE_STARTER", "price_abc");
    vi.stubEnv("STRIPE_PRICE_PRO", "price_def");
    const { planFromPriceId } = await import("./stripe");

    expect(planFromPriceId("price_unknown")).toBeNull();
  });
});
