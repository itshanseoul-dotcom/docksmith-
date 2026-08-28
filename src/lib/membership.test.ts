import { describe, expect, it, vi, beforeEach } from "vitest";

const countMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    membership: { count: (...args: unknown[]) => countMock(...args) },
  },
}));

// isSoleOwnerOfOtherOrg is the server-side guard behind the invite-hijack fix:
// accepting a team invite must not silently strip an org of its only owner.
const { isSoleOwnerOfOtherOrg } = await import("./membership");

describe("isSoleOwnerOfOtherOrg", () => {
  beforeEach(() => {
    countMock.mockReset();
  });

  it("returns false when there is no membership at all", async () => {
    expect(await isSoleOwnerOfOtherOrg(null, "org-b")).toBe(false);
    expect(countMock).not.toHaveBeenCalled();
  });

  it("returns false when the user is not an OWNER", async () => {
    const membership = { id: "m1", organizationId: "org-a", role: "MEMBER" as const };
    expect(await isSoleOwnerOfOtherOrg(membership, "org-b")).toBe(false);
    expect(countMock).not.toHaveBeenCalled();
  });

  it("returns false when the target org is the user's own org", async () => {
    const membership = { id: "m1", organizationId: "org-a", role: "OWNER" as const };
    expect(await isSoleOwnerOfOtherOrg(membership, "org-a")).toBe(false);
    expect(countMock).not.toHaveBeenCalled();
  });

  it("returns true when the user is the sole OWNER of a different org", async () => {
    countMock.mockResolvedValue(0);
    const membership = { id: "m1", organizationId: "org-a", role: "OWNER" as const };
    expect(await isSoleOwnerOfOtherOrg(membership, "org-b")).toBe(true);
    expect(countMock).toHaveBeenCalledWith({
      where: { organizationId: "org-a", role: "OWNER", NOT: { id: "m1" } },
    });
  });

  it("returns false when another OWNER exists in the user's org", async () => {
    countMock.mockResolvedValue(1);
    const membership = { id: "m1", organizationId: "org-a", role: "OWNER" as const };
    expect(await isSoleOwnerOfOtherOrg(membership, "org-b")).toBe(false);
  });
});
