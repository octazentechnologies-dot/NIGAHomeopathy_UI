import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { api } from "../config";
import { INBOX_REFRESH_EVENT } from "./fcm_helper";

const APPOINTMENT_EVENT = "appointmentChanged";
const INBOX_EVENT = "inboxChanged";

const readAuthToken = () => {
  try {
    const auth = JSON.parse(sessionStorage.getItem("authUser") || "null");
    return auth?.token || auth?.Token || auth?.data?.token || "";
  } catch {
    return "";
  }
};

export const patientHubUrl = () => {
  const base = String(api?.API_Base_URL || "").replace(/\/$/, "");
  const origin = base.replace(/\/api$/i, "");
  return `${origin}/hubs/patient`;
};

let sharedConnection = null;
let startPromise = null;
const appointmentListeners = new Set();
const inboxListeners = new Set();
const seenEventIds = new Set();

const rememberEvent = (payload) => {
  const eventId = payload?.eventId || payload?.EventId;
  if (!eventId) return true;
  if (seenEventIds.has(eventId)) return false;
  seenEventIds.add(eventId);
  if (seenEventIds.size > 200) {
    const first = seenEventIds.values().next().value;
    seenEventIds.delete(first);
  }
  return true;
};

const notify = (set, payload) => {
  if (!rememberEvent(payload)) return;
  set.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* ignore listener errors */
    }
  });
};

export const ensurePatientRealtime = async () => {
  const token = readAuthToken();
  if (!token) return null;

  if (sharedConnection?.state === HubConnectionState.Connected) {
    return sharedConnection;
  }
  if (startPromise) return startPromise;

  if (!sharedConnection) {
    sharedConnection = new HubConnectionBuilder()
      .withUrl(patientHubUrl(), { accessTokenFactory: () => readAuthToken() })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    sharedConnection.on(APPOINTMENT_EVENT, (payload) => {
      notify(appointmentListeners, payload);
      try {
        window.dispatchEvent(new CustomEvent(INBOX_REFRESH_EVENT, { detail: payload || {} }));
      } catch {
        /* ignore */
      }
    });
    sharedConnection.on(INBOX_EVENT, (payload) => {
      notify(inboxListeners, payload);
      try {
        window.dispatchEvent(new CustomEvent(INBOX_REFRESH_EVENT, { detail: payload || {} }));
      } catch {
        /* ignore */
      }
    });
    sharedConnection.onreconnected(async () => {
      try {
        await sharedConnection.invoke("JoinPatientInbox");
      } catch {
        /* OnConnected also joins */
      }
    });
  }

  startPromise = (async () => {
    try {
      if (sharedConnection.state === HubConnectionState.Disconnected) {
        await sharedConnection.start();
        try {
          await sharedConnection.invoke("JoinPatientInbox");
        } catch {
          /* group join best-effort */
        }
      }
      return sharedConnection;
    } catch (err) {
      console.warn("[patientRealtime] connect failed", err?.message || err);
      return null;
    } finally {
      startPromise = null;
    }
  })();

  return startPromise;
};

export const subscribePatientAppointmentChanged = (handler) => {
  if (typeof handler !== "function") return () => {};
  appointmentListeners.add(handler);
  ensurePatientRealtime();
  return () => appointmentListeners.delete(handler);
};

export const subscribePatientInboxChanged = (handler) => {
  if (typeof handler !== "function") return () => {};
  inboxListeners.add(handler);
  ensurePatientRealtime();
  return () => inboxListeners.delete(handler);
};

export const stopPatientRealtime = async () => {
  appointmentListeners.clear();
  inboxListeners.clear();
  seenEventIds.clear();
  if (!sharedConnection) return;
  try {
    await sharedConnection.stop();
  } catch {
    /* ignore */
  }
  sharedConnection = null;
  startPromise = null;
};
