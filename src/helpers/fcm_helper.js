import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { registerDevicePushToken, unregisterDevicePushToken } from "./realbackend_helper";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB2X-8zpA8xot-17nCpTafNbOt-otrXgIo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "homeocentrum-mobile.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "homeocentrum-mobile",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "homeocentrum-mobile.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "991452928656",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:991452928656:web:05ddb3391e2e59f61b1615",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-NDL3H9Y401",
};

/** Web Push certificate (VAPID) from Firebase Console → Project settings → Cloud Messaging → Web Push certificates. */
const vapidKey = (process.env.REACT_APP_FIREBASE_VAPID_KEY || "").trim();

let messagingInstance = null;
let foregroundUnsub = null;
let bootPromise = null;

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

async function getMessagingSafe() {
  if (!(await isSupported())) return null;
  if (messagingInstance) return messagingInstance;
  messagingInstance = getMessaging(getFirebaseApp());
  return messagingInstance;
}

async function ensureMessagingWorker() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  return registration;
}

function currentUserId() {
  try {
    const raw = JSON.parse(sessionStorage.getItem("authUser") || "null");
    const data = raw?.data || raw;
    return Number(data?.userId || data?.UserId || 0);
  } catch {
    return 0;
  }
}

export const INBOX_REFRESH_EVENT = "homeocentrum-inbox-refresh";

function notifyInboxRefresh(payload) {
  try {
    window.dispatchEvent(new CustomEvent(INBOX_REFRESH_EVENT, { detail: payload || {} }));
  } catch {
    /* ignore */
  }
}

function showForegroundNotification(payload) {
  notifyInboxRefresh(payload);
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const title = payload?.notification?.title || payload?.data?.title || "Homeocentrum";
  const body = payload?.notification?.body || payload?.data?.body || "";
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      data: payload?.data || {},
    });
    n.onclick = () => {
      window.focus();
      n.close();
      const link = payload?.data?.deepLink || payload?.data?.deeplink;
      if (link && typeof link === "string" && link.startsWith("/")) {
        window.location.assign(link);
      }
    };
  } catch {
    /* Notifications constructor can fail in insecure contexts */
  }
}

/**
 * After login (and on session restore): permission, FCM token, POST /api/Device/Register.
 * deviceType is always Website for this SPA.
 */
export async function registerWebFcmToken(userId) {
  const uid = Number(userId || currentUserId() || 0);
  if (!uid || uid <= 0) return { ok: false, reason: "no-user" };
  if (!vapidKey) {
    console.warn(
      "[FCM] Set REACT_APP_FIREBASE_VAPID_KEY (Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair)."
    );
    return { ok: false, reason: "missing-vapid" };
  }

  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      return { ok: false, reason: "permission-denied" };
    }

    const messaging = await getMessagingSafe();
    if (!messaging) return { ok: false, reason: "not-supported" };

    const registration = await ensureMessagingWorker();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration || undefined,
    });
    if (!token) return { ok: false, reason: "no-token" };

    await registerDevicePushToken({
      token,
      userId: uid,
      deviceType: "Website",
      deviceId: "web-" + (window.location.hostname || "local"),
    });

    try {
      sessionStorage.setItem("fcmToken", token);
    } catch {
      /* ignore */
    }

    await listenForegroundFcm(showForegroundNotification);
    return { ok: true, token };
  } catch (err) {
    console.warn("[FCM] register failed", err);
    return { ok: false, reason: err?.message || "error" };
  }
}

/** Call once after login or when authUser is already in sessionStorage (page refresh). */
export function bootWebFcm() {
  if (bootPromise) return bootPromise;
  bootPromise = registerWebFcmToken(currentUserId()).finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

export async function unregisterWebFcmToken() {
  if (typeof foregroundUnsub === "function") {
    try {
      foregroundUnsub();
    } catch {
      /* ignore */
    }
    foregroundUnsub = null;
  }
  let token = "";
  try {
    token = sessionStorage.getItem("fcmToken") || "";
  } catch {
    token = "";
  }
  try {
    sessionStorage.removeItem("fcmToken");
  } catch {
    /* ignore */
  }
  if (!token) return;
  try {
    await unregisterDevicePushToken({ token });
  } catch {
    /* logout still proceeds; Account/Logout also clears tokens */
  }
}

/** Foreground messages while the tab is open. */
export async function listenForegroundFcm(handler) {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  if (typeof foregroundUnsub === "function") {
    try {
      foregroundUnsub();
    } catch {
      /* ignore */
    }
  }
  foregroundUnsub = onMessage(messaging, (payload) => {
    if (typeof handler === "function") handler(payload);
  });
  return foregroundUnsub;
}
