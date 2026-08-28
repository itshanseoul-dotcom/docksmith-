import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    errorLog: { create: (...args: unknown[]) => createMock(...args) },
  },
}));

const { logError } = await import("./error-log");

describe("logError", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("writes the expected fields to the DB", async () => {
    createMock.mockResolvedValue({});
    await logError({
      source: "server",
      message: "boom",
      stack: "Error: boom\n at x",
      digest: "abc",
      url: "https://example.com/api",
      organizationId: "org-1",
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        source: "server",
        message: "boom",
        stack: "Error: boom\n at x",
        digest: "abc",
        url: "https://example.com/api",
        organizationId: "org-1",
      },
    });
  });

  it("truncates overly long message and stack instead of failing", async () => {
    createMock.mockResolvedValue({});
    await logError({ source: "client", message: "x".repeat(5000), stack: "y".repeat(20000) });

    const data = createMock.mock.calls[0][0].data;
    expect(data.message).toHaveLength(2000);
    expect(data.stack).toHaveLength(8000);
  });

  it("never throws even if the DB write fails", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    await expect(logError({ source: "server", message: "boom" })).resolves.toBeUndefined();
  });

  it("defaults optional fields to null", async () => {
    createMock.mockResolvedValue({});
    await logError({ source: "client", message: "boom" });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        source: "client",
        message: "boom",
        stack: null,
        digest: null,
        url: null,
        organizationId: null,
      },
    });
  });
});
