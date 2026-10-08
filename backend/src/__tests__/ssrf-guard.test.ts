import { lookup } from "dns/promises";
import { assertSafeUrl, isPrivateAddress, UnsafeUrlError } from "../validation/ssrf-guard";

jest.mock("dns/promises");

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.5", "172.31.255.255", "192.168.1.1",
    "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "::", "fc00::1", "fd12::1",
    "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1",
  ])("treats %s as private", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111"])("treats %s as public", (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe("assertSafeUrl", () => {
  it("rejects invalid URLs and non-http schemes", async () => {
    await expect(assertSafeUrl("not a url")).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertSafeUrl("ftp://example.com/feed")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects URLs containing credentials", async () => {
    await expect(assertSafeUrl("https://user:pw@example.com/rss")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects private IP literals without any DNS lookup", async () => {
    await expect(assertSafeUrl("http://127.0.0.1:5432")).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertSafeUrl("http://169.254.169.254/latest/meta-data")).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertSafeUrl("http://[::1]/")).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects a hostname that resolves to a private address", async () => {
    (lookup as jest.Mock).mockResolvedValue([{ address: "10.0.0.8", family: 4 }]);
    await expect(assertSafeUrl("http://internal.example.com/rss")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects a hostname if any of its addresses is private", async () => {
    (lookup as jest.Mock).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    await expect(assertSafeUrl("http://mixed.example.com")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects a hostname that does not resolve", async () => {
    (lookup as jest.Mock).mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertSafeUrl("http://does-not-exist.example")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("accepts a public https URL", async () => {
    (lookup as jest.Mock).mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const url = await assertSafeUrl("https://hnrss.org/frontpage");
    expect(url.hostname).toBe("hnrss.org");
  });
});