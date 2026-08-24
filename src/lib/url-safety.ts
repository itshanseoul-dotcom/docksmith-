import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 127) return true; // 루프백 (127.0.0.0/8)
  if (a === 10) return true; // 사설망
  if (a === 172 && b >= 16 && b <= 31) return true; // 사설망
  if (a === 192 && b === 168) return true; // 사설망
  if (a === 169 && b === 254) return true; // 링크 로컬 — 클라우드 메타데이터(169.254.169.254) 포함
  if (a === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 공유 대역
  if (a >= 224) return true; // 멀티캐스트/예약
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 링크 로컬
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7 유니크 로컬
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice("::ffff:".length);
    if (net.isIPv4(v4)) return isPrivateIPv4(v4);
  }
  return false;
}

function isPrivateIp(ip: string): boolean {
  return net.isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
}

// 웹훅처럼 "사용자가 준 주소로 서버가 직접 요청을 보내는" 기능은 SSRF 통로가 되기
// 쉽다 — 내부 전용 주소(localhost, 사설망, 클라우드 메타데이터 등)를 걸러낸다.
// DNS는 등록 시점과 전송 시점 사이에 바뀔 수 있으므로(리바인딩), 이 함수는
// "지금 이 순간" 안전한지만 보장한다 — 등록할 때와 매번 보내기 직전에 다시 호출해야 한다.
export async function isSafeWebhookUrl(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;

  if (net.isIP(hostname)) {
    return !isPrivateIp(hostname);
  }

  let addresses: string[];
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map((r) => r.address);
  } catch {
    return false;
  }

  if (addresses.length === 0) return false;

  return addresses.every((addr) => !isPrivateIp(addr));
}
