import { api } from "../config";

/**
 * Doctor-app portal session.
 * The URL only ever carries a one-time code. The JWT stays in this tab's sessionStorage.
 * A long case stays signed in by renewing a 20-minute token while the doctor is working.
 * Renewal stops after 20 minutes of no use, and it cannot pass 5 hours.
 */

const ENDED_KEY = "webHandoffEnded";
const ENDED_EVENT = "web-handoff-ended";
const TOKEN_USE = "web_handoff";
const RENEW_LEAD_MS = 8 * 60 * 1000;
const BACKUP_EVERY_MS = 2 * 60 * 1000;

let lastActivityAt = 0;
let lastRenewAt = 0;
let lastBackupAt = 0;
let renewing = null;

const readJson = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

export const readWebHandoff = () => {
  const auth = readJson("authUser");
  if (!auth || auth.tokenUse !== TOKEN_USE || !auth.token) return null;
  return auth;
};

export const isWebHandoffSession = () => readWebHandoff() != null;

export const webHandoffEndedReason = () => {
  const value = sessionStorage.getItem(ENDED_KEY);
  return value && value.trim() ? value : null;
};

export const noteWebHandoffActivity = () => {
  if (!isWebHandoffSession() || webHandoffEndedReason()) return;
  lastActivityAt = Date.now();
};

const apiUrl = (path) => {
  const base = String(api.API_Base_URL || "").replace(/\/$/, "");
  return `${base}${path}`;
};

const parseBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const fail = (code, message) => {
  const error = new Error(message || "Portal session ended.");
  error.code = code || "ENDED";
  return error;
};

const markEnded = (reason) => {
  const code = reason || "ended";
  try {
    sessionStorage.setItem(ENDED_KEY, code);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ENDED_EVENT, { detail: { reason: code } }));
};

const writeAuth = (auth) => {
  sessionStorage.setItem("authUser", JSON.stringify(auth));
  sessionStorage.removeItem(ENDED_KEY);
};

const allowedReturnUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("nigadoctor://portal-return")) return true;
  try {
    const parsed = new URL(url);
    const local = parsed.hostname === "localhost";
    const portal = parsed.hostname === "nigaui.homeocentrum.com";
    const path = parsed.pathname.replace(/\/$/, "");
    const returnPath = path === "/auth/app-return" || path === "/app-return";
    if (parsed.protocol === "https:" && portal && returnPath) return true;
    if (parsed.protocol === "http:" && local && returnPath) return true;
  } catch {
    return false;
  }
  return false;
};

const withQuery = (url, params) => {
  const join = url.includes("?") ? "&" : "?";
  const query = Object.entries(params)
    .filter(([, value]) => value != null && String(value).length > 0)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return query ? `${url}${join}${query}` : url;
};

const exchanges = new Map();

export const exchangeWebHandoff = (code) => {
  const key = String(code || "");
  const existing = exchanges.get(key);
  if (existing) return existing;
  const promise = exchangeWebHandoffOnce(key).finally(() => exchanges.delete(key));
  exchanges.set(key, promise);
  return promise;
};

const exchangeWebHandoffOnce = async (code) => {
  const response = await fetch(apiUrl("/Account/WebHandoff/Exchange"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const body = await parseBody(response);
  const data = body?.data ?? null;
  if (!response.ok || !data?.token) {
    throw fail(body?.code || "HANDOFF_EXPIRED", body?.message);
  }
  const auth = {
    ...data,
    tokenUse: TOKEN_USE,
    issuedAt: new Date().toISOString(),
  };
  writeAuth(auth);
  lastActivityAt = Date.now();
  lastRenewAt = Date.now();
  return auth;
};

const applyRenewal = (auth, body) => {
  const next = {
    ...auth,
    token: body.token,
    expiresAt: body.expiresAt || auth.expiresAt,
    absoluteExpiresAt: body.absoluteExpiresAt || auth.absoluteExpiresAt,
    absoluteRemainingSeconds: body.absoluteRemainingSeconds,
    renewAfterSeconds: body.renewAfterSeconds || auth.renewAfterSeconds,
    issuedAt: new Date().toISOString(),
  };
  writeAuth(next);
  lastRenewAt = Date.now();
  return next;
};

export const renewWebHandoff = () => {
  if (renewing) return renewing;
  renewing = renewOnce().finally(() => {
    renewing = null;
  });
  return renewing;
};

const renewOnce = async () => {
  const auth = readWebHandoff();
  if (!auth) throw fail("REVOKED", "Portal session missing.");
  if (webHandoffEndedReason()) throw fail(webHandoffEndedReason(), "Portal session ended.");

  const response = await fetch(apiUrl("/Account/WebHandoff/Renew"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
  });
  const body = await parseBody(response);
  if (response.status === 409 && body?.code === "SUPERSEDED") {
    return readWebHandoff();
  }
  if (!response.ok || !body?.token) {
    const code = body?.code || "REVOKED";
    if (code !== "SUPERSEDED") markEnded(code);
    throw fail(code, body?.message);
  }
  return applyRenewal(auth, body);
};

export const recoverWebHandoffAfter401 = async (failedAuthorization) => {
  const auth = readWebHandoff();
  if (!auth || webHandoffEndedReason()) return false;
  const failed = String(failedAuthorization || "").replace(/^Bearer\s+/i, "").trim();
  if (failed && auth.token && failed !== auth.token) return true;
  try {
    await renewWebHandoff();
    return !webHandoffEndedReason();
  } catch {
    return false;
  }
};

const revokeWebHandoff = async () => {
  const auth = readWebHandoff();
  if (!auth?.token) return;
  try {
    await fetch(apiUrl("/Account/WebHandoff/Revoke"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      keepalive: true,
    });
  } catch {
    /* The phone also revokes when the browser closes. */
  }
};

export const returnToDoctorApp = async (result = "opened") => {
  const auth = readWebHandoff();
  const safeResult = ["opened", "draft", "completed", "idle", "expired", "failed"].includes(result)
    ? result
    : "opened";
  const patientAppId = auth?.patientAppId != null && /^\d+$/.test(String(auth.patientAppId))
    ? String(auth.patientAppId)
    : "";
  await revokeWebHandoff();
  try {
    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem(ENDED_KEY);
    sessionStorage.removeItem("authUserRole");
  } catch {
    /* ignore */
  }
  const base = allowedReturnUrl(auth?.returnUrl) ? auth.returnUrl : "nigadoctor://portal-return";
  window.location.assign(withQuery(base, { result: safeResult, patientAppId }));
};

const idleMs = (auth) => {
  const seconds = Number(auth?.idleTimeoutSeconds);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 20 * 60) * 1000;
};

const renewAfterMs = (auth) => {
  const seconds = Number(auth?.renewAfterSeconds);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 10 * 60) * 1000;
};

const tokenExpiresAt = (auth) => {
  const parsed = Date.parse(auth?.expiresAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const absoluteRemaining = (auth) => {
  const parsed = Date.parse(auth?.absoluteExpiresAt || "");
  if (!Number.isFinite(parsed)) return null;
  return parsed - Date.now();
};

/**
 * Keeps a handoff case signed in. `saveWork` persists the open board before a pause or a return.
 * `onWarning` receives remaining milliseconds when the 5-hour cap is inside 15 minutes.
 */
export const startWebHandoffKeeper = ({ onWarning, onEnded, saveWork } = {}) => {
  const auth = readWebHandoff();
  if (!auth) return () => {};

  if (!lastActivityAt) lastActivityAt = Date.now();
  if (!lastRenewAt) lastRenewAt = Date.now();

  const endedNow = webHandoffEndedReason();
  if (endedNow && onEnded) onEnded(endedNow);

  const onAct = () => noteWebHandoffActivity();
  const onEndedEvent = (event) => {
    if (onEnded) onEnded(event.detail?.reason || "ended");
  };
  const options = { capture: true, passive: true };
  window.addEventListener("pointerdown", onAct, options);
  window.addEventListener("keydown", onAct, options);
  window.addEventListener("touchstart", onAct, options);
  window.addEventListener(ENDED_EVENT, onEndedEvent);

  const tick = async () => {
    const current = readWebHandoff();
    if (!current || webHandoffEndedReason()) return;
    const now = Date.now();
    const idleFor = now - lastActivityAt;
    if (idleFor >= idleMs(current)) {
      if (saveWork) {
        try { await saveWork(); } catch { /* backup is best-effort */ }
      }
      markEnded("IDLE");
      revokeWebHandoff();
      return;
    }

    const remaining = absoluteRemaining(current);
    if (remaining != null && remaining <= 15 * 60 * 1000 && onWarning) onWarning(remaining);

    const due = now - lastRenewAt >= renewAfterMs(current);
    const expiring = tokenExpiresAt(current) > 0 && tokenExpiresAt(current) - now <= RENEW_LEAD_MS;
    if ((due || expiring) && idleFor < idleMs(current)) {
      try {
        const next = await renewWebHandoff();
        const left = absoluteRemaining(next);
        if (left != null && onWarning) onWarning(left);
      } catch (error) {
        if (error?.code === "IDLE" || error?.code === "ABSOLUTE" || error?.code === "REUSE" || error?.code === "REVOKED") {
          if (onEnded) onEnded(error.code);
        }
      }
    }

    if (saveWork && now - lastBackupAt >= BACKUP_EVERY_MS && idleFor < 60 * 1000) {
      lastBackupAt = now;
      try { await saveWork(); } catch { /* no board work yet */ }
    }
  };

  const timer = window.setInterval(() => {
    tick();
  }, 30 * 1000);
  tick();

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("pointerdown", onAct, options);
    window.removeEventListener("keydown", onAct, options);
    window.removeEventListener("touchstart", onAct, options);
    window.removeEventListener(ENDED_EVENT, onEndedEvent);
  };
};

export const formatHandoffRemaining = (ms) => {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "a few minutes";
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${rest} minute${rest === 1 ? "" : "s"}`;
};
