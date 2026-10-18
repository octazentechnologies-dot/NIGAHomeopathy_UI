import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { registerDevicePushToken } from "./realbackend_helper";

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

/**
 * After login: request notification permission, get FCM token, POST /api/Device/Register.
 * deviceType is always Website for this SPA.
 */
export async function registerWebFcmToken(userId) {
  if (!userId || userId <= 0) return { ok: false, reason: "no-user" };
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

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    const token = await getToken(messaging, { vapidKey });
    if (!token) return { ok: false, reason: "no-token" };

    await registerDevicePushToken({
      token,
      userId,
      deviceType: "Website",
      deviceId: "web-" + (window.location.hostname || "local"),
    });

    try {
      sessionStorage.setItem("fcmToken", token);
    } catch {
      /* ignore */
    }

    return { ok: true, token };
  } catch (err) {
    console.warn("[FCM] register failed", err);
    return { ok: false, reason: err?.message || "error" };
  }
}

/** Foreground messages while the tab is open. */
export async function listenForegroundFcm(handler) {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    if (typeof handler === "function") handler(payload);
  });
}
