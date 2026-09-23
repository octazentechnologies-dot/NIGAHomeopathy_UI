import { api } from "../config";

const DEV_CLINIC_DOCTORS = [
  "tufan_doctor",
  "tufan doctor",
  "niga homeopathy",
  "testdoctor",
];

export function isDevClinicDoctorName(name) {
  const n = String(name || "").trim().toLowerCase();
  return DEV_CLINIC_DOCTORS.includes(n);
}

export function readPlanActive(obj, extraName) {
  if (!obj) return false;
  if (obj.isPlanActive === true || obj.IsPlanActive === true) return true;
  if (isDevClinicDoctorName(extraName)) return true;
  if (isDevClinicDoctorName(obj.userName || obj.UserName)) return true;
  return false;
}

export function normalizeAuthSubscription(authUser, loginName) {
  if (!authUser) return authUser;
  const active = readPlanActive(authUser, loginName);
  const daysRaw = authUser.daysRemaining ?? authUser.DaysRemaining ?? 0;
  const days = active ? (Number(daysRaw) > 0 ? Number(daysRaw) : 365) : Number(daysRaw) || 0;
  const lastFive =
    authUser.islastFiveDays === true ||
    authUser.IslastFiveDays === true ||
    (active && days > 0 && days <= 5);

  authUser.isPlanActive = active;
  authUser.IsPlanActive = active;
  authUser.daysRemaining = days;
  authUser.DaysRemaining = days;
  authUser.islastFiveDays = lastFive;
  authUser.IslastFiveDays = lastFive;
  return authUser;
}

export function pickSubscriptionStatus(payload) {
  const status = payload?.data ?? payload;
  return {
    isPlanActive: status?.isPlanActive === true || status?.IsPlanActive === true,
    islastFiveDays: status?.islastFiveDays === true || status?.IslastFiveDays === true,
    daysRemaining: status?.daysRemaining ?? status?.DaysRemaining ?? 0,
    userName: status?.userName ?? status?.UserName,
  };
}

function sessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem("authUser") || "null") || {};
  } catch (e) {
    return {};
  }
}

function collectClientContext() {
  const nav = typeof navigator !== "undefined" ? navigator : {};
  const ua = String(nav.userAgent || "");
  const uaData = nav.userAgentData || {};
  let browser = "Unknown";
  let browserVersion = "";
  const edge = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/);
  const opera = ua.match(/OPR\/([\d.]+)/);
  const firefox = ua.match(/Firefox\/([\d.]+)/);
  const chrome = ua.match(/Chrome\/([\d.]+)/);
  const safari = ua.match(/Version\/([\d.]+).*Safari/);
  if (edge) {
    browser = "Microsoft Edge";
    browserVersion = edge[1];
  } else if (opera) {
    browser = "Opera";
    browserVersion = opera[1];
  } else if (firefox) {
    browser = "Firefox";
    browserVersion = firefox[1];
  } else if (chrome && ua.indexOf("Chromium") < 0) {
    browser = "Chrome";
    browserVersion = chrome[1];
  } else if (safari) {
    browser = "Safari";
    browserVersion = safari[1];
  }

  let os = "Unknown";
  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let deviceType = "Desktop";
  if (/iPad|Tablet/i.test(ua)) deviceType = "Tablet";
  else if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) deviceType = "Mobile";

  let deviceName = uaData.platform || nav.platform || os;
  if (/iPhone/i.test(ua)) deviceName = "iPhone";
  else if (/iPad/i.test(ua)) deviceName = "iPad";
  else if (deviceType === "Desktop") deviceName = os + " PC";

  const scr = typeof screen !== "undefined" ? screen : {};
  const win = typeof window !== "undefined" ? window : {};
  let timeZone = "";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    timeZone = "";
  }

  return {
    userAgent: ua,
    browser: browser + (browserVersion ? " " + browserVersion : ""),
    os,
    deviceType,
    deviceName,
    platform: String(nav.platform || uaData.platform || ""),
    screen:
      scr.width && scr.height
        ? scr.width + "x" + scr.height + "@" + (win.devicePixelRatio || 1)
        : "",
    language: String(nav.language || ""),
    timeZone,
    href: win.location && win.location.href ? win.location.href : "",
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
  };
}

export function reportClientIssue(payload) {
  try {
    const base = (api && api.API_URL_NIGAHOMEOPATHY) || "";
    if (!base) return;
    const url = String((payload && payload.url) || "");
    if (url.toLowerCase().includes("diagnostics")) return;
    const user = sessionUser();
    const data = user.data || user;
    const ctx = collectClientContext();
    const first = data.firstName || data.FirstName || "";
    const last = data.lastName || data.LastName || "";
    const body = {
      source: payload && payload.source,
      url: payload && payload.url,
      status: payload && payload.status,
      method: payload && payload.method,
      message: payload && payload.message,
      stack: payload && payload.stack,
      componentStack: payload && payload.componentStack,
      userName: data.userName || data.UserName || user.userName,
      displayName: (first + " " + last).trim() || data.fullName || data.FullName,
      userId: String(data.userId ?? data.UserId ?? user.userId ?? ""),
      role: data.role || data.Role || user.role,
      userAgent: ctx.userAgent,
      browser: ctx.browser,
      os: ctx.os,
      deviceType: ctx.deviceType,
      deviceName: ctx.deviceName,
      platform: ctx.platform,
      screen: ctx.screen,
      language: ctx.language,
      timeZone: ctx.timeZone,
      href: ctx.href,
      referrer: ctx.referrer,
    };
    fetch(base + "/Diagnostics/ClientError", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
    // never break the app
  }
}
