import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { api } from "../config";
import { INBOX_REFRESH_EVENT } from "./fcm_helper";
import {
  REMINDER_DASHBOARD_REFRESH_EVENT,
  REMINDER_INBOX_REFRESH_EVENT,
} from "./doctorReminderFire";

const EVENT = "appointmentRequestChanged";
const APPOINTMENT_EVENT = "appointmentChanged";
const INBOX_EVENT = "inboxChanged";
const REMINDER_EVENT = "reminderChanged";
const REMINDER_DUE_EVENT = "reminderDue";
const OFFER_EVENT = "instantOfferChanged";
const FOLLOWUP_EVENT = "followUpChanged";

export const INSTANT_OFFER_REFRESH_EVENT = "homeocentrum-instant-offer-refresh";
export const FOLLOWUP_DUE_REFRESH_EVENT = "homeocentrum-followup-due-refresh";
export const REMINDER_DUE_EVENT_NAME = "homeocentrum-doctor-reminder-due";

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
const inboxListeners = new Set();
const reminderListeners = new Set();
const reminderDueListeners = new Set();
const offerListeners = new Set();
const followUpListeners = new Set();
const seenAppointmentEventIds = new Set();

const notifySet = (set, payload) => {
  set.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* listener errors must not break the hub */
    }
  });
};

const dispatchWindow = (name, payload) => {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail: payload || {} }));
  } catch {
    /* window may be unavailable in tests */
  }
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
  notifySet(appointmentListeners, payload);
  dispatchWindow(INBOX_REFRESH_EVENT, payload);
};

const notifyInboxListeners = (payload) => {
  notifySet(inboxListeners, payload);
  dispatchWindow(INBOX_REFRESH_EVENT, payload);
  dispatchWindow(REMINDER_INBOX_REFRESH_EVENT, payload);
};

const notifyReminderListeners = (payload) => {
  notifySet(reminderListeners, payload);
  dispatchWindow(REMINDER_DASHBOARD_REFRESH_EVENT, payload);
};

const notifyReminderDueListeners = (payload) => {
  notifySet(reminderDueListeners, payload);
  dispatchWindow(REMINDER_DUE_EVENT_NAME, payload);
  dispatchWindow(REMINDER_DASHBOARD_REFRESH_EVENT, payload);
  dispatchWindow(INBOX_REFRESH_EVENT, payload);
};

const notifyOfferListeners = (payload) => {
  notifySet(offerListeners, payload);
  dispatchWindow(INSTANT_OFFER_REFRESH_EVENT, payload);
};

const notifyFollowUpListeners = (payload) => {
  notifySet(followUpListeners, payload);
  dispatchWindow(FOLLOWUP_DUE_REFRESH_EVENT, payload);
  dispatchWindow(INBOX_REFRESH_EVENT, payload);
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

    sharedConnection.on(EVENT, (payload) => notifySet(listeners, payload));
    sharedConnection.on(APPOINTMENT_EVENT, (payload) => notifyAppointmentListeners(payload));
    sharedConnection.on(INBOX_EVENT, (payload) => notifyInboxListeners(payload));
    sharedConnection.on(REMINDER_EVENT, (payload) => notifyReminderListeners(payload));
    sharedConnection.on(REMINDER_DUE_EVENT, (payload) => notifyReminderDueListeners(payload));
    sharedConnection.on(OFFER_EVENT, (payload) => notifyOfferListeners(payload));
    sharedConnection.on(FOLLOWUP_EVENT, (payload) => notifyFollowUpListeners(payload));
    sharedConnection.onreconnected(async () => {
      try {
        await sharedConnection.invoke("JoinDoctorInbox");
      } catch {
        /* group re-join is best-effort; OnConnected also joins */
      }
      // Catch up after reconnect — no continuous polling while connected.
      dispatchWindow(INBOX_REFRESH_EVENT, { reason: "reconnected" });
      dispatchWindow(REMINDER_DASHBOARD_REFRESH_EVENT, { reason: "reconnected" });
      dispatchWindow(INSTANT_OFFER_REFRESH_EVENT, { reason: "reconnected" });
      dispatchWindow(FOLLOWUP_DUE_REFRESH_EVENT, { reason: "reconnected" });
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

const subscribe = (set, handler) => {
  if (typeof handler !== "function") return () => {};
  set.add(handler);
  ensureClinicRealtime();
  return () => {
    set.delete(handler);
  };
};

/** Subscribe to appointment-request push events. Returns unsubscribe. */
export const subscribeAppointmentRequests = (handler) => subscribe(listeners, handler);

/** Subscribe to booked / rescheduled / cancelled appointment calendar events. */
export const subscribeAppointmentChanged = (handler) => subscribe(appointmentListeners, handler);

export const subscribeInboxChanged = (handler) => subscribe(inboxListeners, handler);

export const subscribeReminderChanged = (handler) => subscribe(reminderListeners, handler);

export const subscribeReminderDue = (handler) => subscribe(reminderDueListeners, handler);

export const subscribeInstantOfferChanged = (handler) => subscribe(offerListeners, handler);

export const subscribeFollowUpChanged = (handler) => subscribe(followUpListeners, handler);

export const stopClinicRealtime = async () => {
  listeners.clear();
  appointmentListeners.clear();
  inboxListeners.clear();
  reminderListeners.clear();
  reminderDueListeners.clear();
  offerListeners.clear();
  followUpListeners.clear();
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
