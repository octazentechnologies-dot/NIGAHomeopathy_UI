import { authProtectedRoutes } from "../Routes/allRoutes";

const PLACEHOLDERS = new Set(["", "#", "/#", "#!", "/#!", "javascript:void(0)", "javascript:void(0);"]);

const routePattern = (pattern) => {
  let path = String(pattern || "").trim();
  if (!path || path === "*" || path === "/*") return null;
  if (!path.startsWith("/")) path = `/${path}`;
  const body = path
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment.startsWith(":")) return "[^/]+";
      if (segment === "*") return ".*";
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${body}/?$`, "i");
};

let appRoutePatterns;

const patternsOf = () => {
  if (!appRoutePatterns) {
    appRoutePatterns = authProtectedRoutes
      .map((route) => routePattern(route.path))
      .filter(Boolean);
  }
  return appRoutePatterns;
};

export const isRegisteredAppPath = (link) => {
  const raw = String(link || "").trim();
  if (!raw || PLACEHOLDERS.has(raw)) return false;
  if (/^https?:\/\//i.test(raw)) return true;
  const path = raw.split("?")[0].split("#")[0];
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return patternsOf().some((pattern) => pattern.test(normalized));
};

/** Menu targets with no page stay inside the app on the unavailable screen. */
export const menuDestination = (link) => {
  const raw = String(link || "").trim();
  if (!raw || PLACEHOLDERS.has(raw)) return "/page-not-available";
  if (/^https?:\/\//i.test(raw)) return raw;
  return isRegisteredAppPath(raw) ? (raw.startsWith("/") ? raw : `/${raw}`) : "/page-not-available";
};
