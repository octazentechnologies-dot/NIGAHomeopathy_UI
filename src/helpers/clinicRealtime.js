import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { api } from "../config";
import { INBOX_REFRESH_EVENT } from "./fcm_helper";

const EVENT = "appointmentRequestChanged";
const APPOINTMENT_EVENT = "appointmentChanged";

const readAuthToken = () => {
  try {
    const auth = JSON.parse(sessionStorage.getItem("authUser") || "null");
    return auth?.token || auth?.Token || auth?.data?.token || "";
  } catch {
    return "";
  }
};

/** Hub lives on API host root (not under /api). */
export const clinicHubUrl = () => {
  const base = String(api?.API_Base_URL || "").replace(/\/$/, "");
  const origin = base.replace(/\/api$/i, "");
  return `${origin}/hubs/clinic`;
};

let sharedConnection = null;
let startPromise = null;
const listeners = new Set();
const appointmentListeners = new Set();
const seenAppointmentEventIds = new Set();

const notifyListeners = (payload) => {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* listener errors must not break the hub */
    }
  });
};

const notifyAppointmentListeners = (payload) => {
  const eventId = payload?.eventId || payload?.EventId;
  if (eventId) {
    if (seenAppointmentEventIds.has(eventId)) return;
    seenAppointmentEventIds.add(eventId);
    if (seenAppointmentEventIds.size > 200) {
      const first = seenAppointmentEventIds.values().next().value;
      seenAppointmentEventIds.delete(first);
    }
  }
  appointmentListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* listener errors must not break the hub */
    }
  });
  try {
    window.dispatchEvent(new CustomEvent(INBOX_REFRESH_EVENT, { detail: payload || {} }));
  } catch {
    /* window may be unavailable in tests */
  }
};

/**
 * Shared SignalR connection for doctor clinic inbox.
 * One connection per browser tab; subscribe/unsubscribe for badge + page.
 */
const readSessionRole = () => {
  try {
    const auth = JSON.parse(sessionStorage.getItem("authUser") || "null");
    const session = auth?.data || auth;
    return session?.role || auth?.role || "";
  } catch {
    return "";
  }
};

/** Clinic hub is for Doctor / Reception only (JWT must carry DoctorID). */
const canUseClinicHub = () => {
  const role = String(readSessionRole() || "");
  return role === "Doctor" || role === "Reception";
};

export const ensureClinicRealtime = async () => {
  const token = readAuthToken();
  if (!token) return null;
  if (!canUseClinicHub()) return null;

  if (sharedConnection?.state === HubConnectionState.Connected) {
    return sharedConnection;
  }

  if (startPromise) return startPromise;

  if (!sharedConnection) {
    sharedConnection = new HubConnectionBuilder()
      .withUrl(clinicHubUrl(), { accessTokenFactory: () => readAuthToken() })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    sharedConnection.on(EVENT, (payload) => notifyListeners(payload));
    sharedConnection.on(APPOINTMENT_EVENT, (payload) => notifyAppointmentListeners(payload));
    sharedConnection.onreconnected(async () => {
      try {
        await sharedConnection.invoke("JoinDoctorInbox");
      } catch {
        /* group re-join is best-effort; OnConnected also joins */
      }
    });
  }

  startPromise = (async () => {
    try {
      if (sharedConnection.state === HubConnectionState.Disconnected) {
        await sharedConnection.start();
        try {
          await sharedConnection.invoke("JoinDoctorInbox");
        } catch {
          /* OnConnectedAsync already adds the doctor group */
        }
      }
      return sharedConnection;
    } catch (err) {
      console.warn("[clinicRealtime] connect failed", err?.message || err);
      return null;
    } finally {
      startPromise = null;
    }
  })();

  return startPromise;
};

/** Subscribe to appointment-request push events. Returns unsubscribe. */
export const subscribeAppointmentRequests = (handler) => {
  if (typeof handler !== "function") return () => {};
  listeners.add(handler);
  ensureClinicRealtime();
  return () => {
    listeners.delete(handler);
  };
};

/** Subscribe to booked / rescheduled / cancelled appointment calendar events. */
export const subscribeAppointmentChanged = (handler) => {
  if (typeof handler !== "function") return () => {};
  appointmentListeners.add(handler);
  ensureClinicRealtime();
  return () => {
    appointmentListeners.delete(handler);
  };
};

export const stopClinicRealtime = async () => {
  listeners.clear();
  appointmentListeners.clear();
  seenAppointmentEventIds.clear();
  if (!sharedConnection) return;
  try {
    await sharedConnection.stop();
  } catch {
    /* ignore */
  }
  sharedConnection = null;
  startPromise = null;
};
