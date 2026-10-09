import dns from "dns";
import http from "http";
import type { AddressInfo } from "net";
import { safeFetchText } from "../services/safe-fetch";
import { UnsafeUrlError } from "../validation/ssrf-guard";

// A local server plays both "the internet" and "the internal network":
// tests that need a reachable public host pretend 127.0.0.1 is public with
// `onlyLoopbackAllowed`; the others use the real rule, where it is private.
let server: http.Server;
let base: string;
const hits: string[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    hits.push(req.url ?? "");
    if (req.url === "/feed") return res.end("<rss>ok</rss>");
    if (req.url === "/to-internal") {
      res.writeHead(302, { Location: "http://10.0.0.1/admin" });
      return res.end();
    }
    if (req.url === "/to-feed") {
      res.writeHead(301, { Location: "/feed" });
      return res.end();
    }
    if (req.url === "/loop") {
      res.writeHead(302, { Location: "/loop" });
      return res.end();
    }
    if (req.url === "/big") return res.end("x".repeat(2000));
    if (req.url === "/slow") return; // never answers
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.closeAllConnections();
  return new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  hits.length = 0;
});

afterEach(() => jest.restoreAllMocks());

const onlyLoopbackAllowed = (ip: string) => ip !== "127.0.0.1";

describe("safeFetchText", () => {
  it("refuses an internal address and never contacts it", async () => {
    await expect(safeFetchText(`${base}/feed`)).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(hits).toEqual([]);
  });

  it("downloads an allowed URL, following a safe redirect", async () => {
    await expect(safeFetchText(`${base}/to-feed`, { isBlocked: onlyLoopbackAllowed })).resolves.toBe("<rss>ok</rss>");
    expect(hits).toEqual(["/to-feed", "/feed"]);
  });

  it("refuses a public URL that redirects to an internal address", async () => {
    await expect(safeFetchText(`${base}/to-internal`, { isBlocked: onlyLoopbackAllowed })).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    expect(hits).toEqual(["/to-internal"]); // 10.0.0.1 was never contacted
  });

  it("refuses DNS rebinding: public when checked, internal when connecting", async () => {
    const port = (server.address() as AddressInfo).port;
    // First resolution (the check) says 127.0.0.1, allowed here...
    jest.spyOn(dns.promises, "lookup").mockResolvedValue([{ address: "127.0.0.1", family: 4 }] as never);
    // ...but the one made when connecting says 10.0.0.1.
    jest.spyOn(dns, "lookup").mockImplementation(((_host: string, _opts: unknown, cb: Function) =>
      cb(null, [{ address: "10.0.0.1", family: 4 }])) as never);

    await expect(
      safeFetchText(`http://rebind.example:${port}/feed`, { isBlocked: onlyLoopbackAllowed })
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(hits).toEqual([]);
  });

  it("stops after too many redirects", async () => {
    await expect(
      safeFetchText(`${base}/loop`, { isBlocked: onlyLoopbackAllowed, maxRedirects: 3 })
    ).rejects.toThrow("Too many redirects");
    expect(hits).toHaveLength(4);
  });

  it("refuses a response larger than the limit", async () => {
    await expect(
      safeFetchText(`${base}/big`, { isBlocked: onlyLoopbackAllowed, maxBytes: 1000 })
    ).rejects.toThrow("too large");
  });

  it("gives up when the server takes too long", async () => {
    await expect(
      safeFetchText(`${base}/slow`, { isBlocked: onlyLoopbackAllowed, timeoutMs: 200 })
    ).rejects.toThrow("took too long");
  });

  it("refuses non-http schemes", async () => {
    await expect(safeFetchText("file:///etc/passwd")).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});
