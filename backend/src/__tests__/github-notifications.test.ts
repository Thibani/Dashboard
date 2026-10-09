import { notificationsWidget } from "../services/github/widgets/notifications";

jest.mock("../db", () => ({ pool: {} }));

function notification(type: string, url: string | null) {
  return {
    id: "1",
    reason: "review_requested",
    updated_at: "2026-10-09T10:00:00Z",
    subject: { title: "Fix login", type, url },
    repository: { full_name: "Thibani/Dashboard", html_url: "https://github.com/Thibani/Dashboard" },
  };
}

async function urlFor(type: string, apiUrl: string | null) {
  jest.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify([notification(type, apiUrl)]), { status: 200 })
  );
  const data = (await notificationsWidget.fetchData({ number: 5 }, { accessToken: "t" })) as {
    notifications: { url: string }[];
  };
  return data.notifications[0].url;
}

describe("github notifications widget", () => {
  afterEach(() => jest.restoreAllMocks());

  it("links pull requests and issues to their page on github.com", async () => {
    expect(await urlFor("PullRequest", "https://api.github.com/repos/Thibani/Dashboard/pulls/81"))
      .toBe("https://github.com/Thibani/Dashboard/pull/81");
    expect(await urlFor("Issue", "https://api.github.com/repos/Thibani/Dashboard/issues/42"))
      .toBe("https://github.com/Thibani/Dashboard/issues/42");
  });

  it("falls back to the repository when there is no subject url", async () => {
    expect(await urlFor("Discussion", null)).toBe("https://github.com/Thibani/Dashboard");
  });
});
