import dns from "dns";
import http from "http";
import https from "https";
import type { LookupFunction } from "net";
import { assertSafeUrl, isPrivateAddress, UnsafeUrlError } from "../validation/ssrf-guard";

// Downloads a URL given by a user (e.g. an RSS feed) without letting it reach
// the server's own network: the database, other containers, cloud metadata
// (169.254.169.254)... Three holes are closed, not just the first:
//  1. the URL itself points to a private address   -> assertSafeUrl
//  2. a public URL redirects to a private one       -> every hop is re-checked
//  3. DNS rebinding: the host resolves to a public IP when checked, then to
//     127.0.0.1 when the request resolves it again  -> the address actually
//     connected to is checked too (safeLookup)

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  /** Only replaced by tests. */
  isBlocked?: (ip: string) => boolean;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function guardedLookup(isBlocked: (ip: string) => boolean): LookupFunction {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, "", 0);
      const list = addresses as dns.LookupAddress[];
      if (list.length === 0 || list.some((a) => isBlocked(a.address))) {
        return callback(new UnsafeUrlError("This address is not allowed"), "", 0);
      }
      // Node asks for every address when it tries IPv4 and IPv6 in parallel.
      if (options.all) return callback(null, list);
      callback(null, list[0].address, list[0].family);
    });
  };
}

type Hop = { redirect: URL } | { body: string };

function requestOnce(url: URL, options: Required<SafeFetchOptions>): Promise<Hop> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    // Several events can end a request (data over the limit, timeout, network
    // error, end): only the first one counts.
    let settled = false;
    const succeed = (hop: Hop) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(hop);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
      req.destroy();
    };

    const req = client.get(
      url,
      {
        // Not used for IP literals (Node connects directly): assertSafeUrl checks those.
        lookup: guardedLookup(options.isBlocked),
        headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      },
      (res) => {
        res.on("error", fail);
        const status = res.statusCode ?? 0;
        if (REDIRECT_STATUSES.has(status) && res.headers.location) {
          res.resume();
          return succeed({ redirect: new URL(res.headers.location, url) });
        }
        if (status < 200 || status >= 300) {
          res.resume();
          return fail(new Error(`The feed answered with status ${status}`));
        }

        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > options.maxBytes) return fail(new Error("The feed is too large"));
          chunks.push(chunk);
        });
        res.on("end", () => succeed({ body: Buffer.concat(chunks).toString("utf8") }));
      }
    );
    req.on("error", fail);
    const timer = setTimeout(() => fail(new Error("The feed took too long to answer")), options.timeoutMs);
  });
}

export async function safeFetchText(input: string, options: SafeFetchOptions = {}): Promise<string> {
  const opts: Required<SafeFetchOptions> = {
    timeoutMs: options.timeoutMs ?? 10_000,
    maxBytes: options.maxBytes ?? 5 * 1024 * 1024,
    maxRedirects: options.maxRedirects ?? 5,
    isBlocked: options.isBlocked ?? isPrivateAddress,
  };

  let next = input;
  for (let hop = 0; hop <= opts.maxRedirects; hop++) {
    const url = await assertSafeUrl(next, opts.isBlocked);
    const result = await requestOnce(url, opts);
    if ("body" in result) return result.body;
    next = result.redirect.toString();
  }
  throw new Error("Too many redirects");
}
