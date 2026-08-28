import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey } from "./api-key";

describe("generateApiKey", () => {
  it("produces a plaintext key with the dk_ prefix", () => {
    const { plaintext } = generateApiKey();
    expect(plaintext).toMatch(/^dk_[0-9a-f]{48}$/);
  });

  it("derives keyPrefix as the first 12 characters of the plaintext", () => {
    const { plaintext, keyPrefix } = generateApiKey();
    expect(keyPrefix).toBe(plaintext.slice(0, 12));
    expect(keyPrefix).toHaveLength(12);
  });

  it("hashes the plaintext consistently and matches hashApiKey", () => {
    const { plaintext, keyHash } = generateApiKey();
    expect(keyHash).toBe(hashApiKey(plaintext));
    expect(keyHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex digest
  });

  it("never stores the plaintext in the hash", () => {
    const { plaintext, keyHash } = generateApiKey();
    expect(keyHash).not.toContain(plaintext);
  });

  it("generates unique keys across calls", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.keyHash).not.toBe(b.keyHash);
  });
});

describe("hashApiKey", () => {
  it("is deterministic for the same input", () => {
    expect(hashApiKey("dk_abc123")).toBe(hashApiKey("dk_abc123"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashApiKey("dk_abc123")).not.toBe(hashApiKey("dk_abc124"));
  });
});
