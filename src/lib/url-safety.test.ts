import { describe, expect, it } from "vitest";
import { isSafeWebhookUrl } from "./url-safety";

describe("isSafeWebhookUrl", () => {
  it.each([
    ["http://169.254.169.254/latest/meta-data/", "cloud metadata"],
    ["http://127.0.0.1:3000/x", "loopback"],
    ["http://localhost/x", "localhost hostname"],
    ["http://10.0.0.5/x", "private 10.x"],
    ["http://192.168.1.1/x", "private 192.168.x"],
    ["http://172.20.0.1/x", "private 172.16-31.x"],
    ["http://[::1]/x", "IPv6 loopback"],
    ["http://[fe80::1]/x", "IPv6 link-local"],
    ["ftp://example.com/x", "non-http protocol"],
    ["not a url", "malformed URL"],
  ])("rejects %s (%s)", async (url) => {
    expect(await isSafeWebhookUrl(url)).toBe(false);
  });

  it.each([
    ["https://hooks.zapier.com/hooks/catch/12345/abcde/", "real external zapier URL"],
    ["https://example.com/webhook", "real external domain"],
  ])("accepts %s (%s)", async (url) => {
    expect(await isSafeWebhookUrl(url)).toBe(true);
  });
});
