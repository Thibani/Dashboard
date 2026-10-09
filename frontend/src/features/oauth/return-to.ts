// Where to bring the user back after "connect my account": the app is left
// entirely for the provider's page, so this has to survive a full reload.
const KEY = "oauth_return_to";

export function rememberReturnTo(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage blocked: the user just lands on the dashboard.
  }
}

export function takeReturnTo(): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    // Only same-app paths: never let this become an open redirect.
    return path && path.startsWith("/") && !path.startsWith("//") ? path : "/";
  } catch {
    return "/";
  }
}
