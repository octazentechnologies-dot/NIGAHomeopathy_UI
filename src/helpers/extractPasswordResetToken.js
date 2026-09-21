/**
 * Reads the reset token from /reset-password/:token, ?token=,
 * or a Gmail-wrapped https://www.google.com/url?q=... link.
 */
export function extractPasswordResetToken({ pathToken, searchParams, href } = {}) {
  const queryToken = searchParams?.get?.("token");
  let token = String(pathToken || queryToken || "").trim();

  const wrapped = searchParams?.get?.("q");
  if (!token && wrapped) {
    token = tokenFromUrlString(wrapped);
  }
  if (!token && href) {
    token = tokenFromUrlString(href);
  }
  if (
    token &&
    (token.startsWith("http://") ||
      token.startsWith("https://") ||
      token.includes("reset-password") ||
      token.includes("google.com/url"))
  ) {
    token = tokenFromUrlString(token) || token;
  }

  try {
    token = decodeURIComponent(token);
  } catch {
    /* keep raw */
  }
  return String(token || "").trim();
}

function tokenFromUrlString(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const nested = url.searchParams.get("q");
    if (nested) {
      const fromNested = tokenFromUrlString(nested);
      if (fromNested) return fromNested;
    }
    const fromQuery = url.searchParams.get("token");
    if (fromQuery) return fromQuery;
    const marker = "/reset-password/";
    const path = url.pathname || "";
    const at = path.toLowerCase().indexOf(marker);
    if (at >= 0) {
      return decodeURIComponent(path.slice(at + marker.length).split("/")[0]);
    }
  } catch {
    /* fall through to regex */
  }

  const queryMatch = raw.match(/[?&]token=([^&]+)/i);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]);
    } catch {
      return queryMatch[1];
    }
  }
  const pathMatch = raw.match(/reset-password\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }
  return "";
}
