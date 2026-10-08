import { lookup } from "dns/promises";
import net from "net";

export class UnsafeUrlError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||                          // 0.0.0.0/8 "this network"
    a === 10 ||                         // 10.0.0.0/8 private
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 carrier-grade NAT
    a === 127 ||                        // loopback
    (a === 169 && b === 254) ||         // link-local, cloud metadata (169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 private (Docker networks live here)
    (a === 192 && b === 168) ||         // 192.168.0.0/16 private
    a >= 224                            // multicast and reserved
  );
}

function isPrivateIPv6(address: string): boolean {
  const ip = address.toLowerCase();
  if (ip === "::" || ip === "::1") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(ip)) return true;                       // fe80::/10 link-local

  // IPv4-mapped (::ffff:a.b.c.d or ::ffff:7f00:1): judge the embedded IPv4 address
  if (ip.startsWith("::ffff:")) {
    const rest = ip.slice("::ffff:".length);
    if (rest.includes(".")) return isPrivateIPv4(rest);
    const [hi, lo] = rest.split(":").map((h) => parseInt(h, 16));
    if (Number.isNaN(hi) || Number.isNaN(lo)) return true;
    return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // not a valid IP: refuse
}

/**
 * Throws UnsafeUrlError unless `input` is an http(s) URL whose host
 * resolves only to public IP addresses. Returns the parsed URL.
 *
 * Limits: the host is resolved here and again by fetch(), so DNS rebinding is
 * not fully covered. Also fetch with `redirect: "manual"` (or re-check each
 * hop), because a public URL can redirect to an internal one.
 */
export async function assertSafeUrl(input: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with credentials are not allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, ""); // strip [] around IPv6 literals

  let addresses: string[];
  if (net.isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = (await lookup(host, { all: true })).map((r) => r.address);
    } catch {
      throw new UnsafeUrlError("Could not resolve the host");
    }
  }

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new UnsafeUrlError("This address is not allowed");
  }
  return url;
}