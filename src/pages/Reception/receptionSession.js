import { getAuthDoctorId } from "../../helpers/appointmentSlotHelper";
import { getReceptionPatientOpen } from "../../helpers/realbackend_helper";

export const readReceptionDoctorId = () => {
  const direct = getAuthDoctorId();
  if (direct) return Number(direct);
  try {
    const raw = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const token = raw.token || raw.Token || raw.data?.token;
    if (!token || !token.includes(".")) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const id = Number(payload.DoctorID || payload.doctorId || 0);
    return id || null;
  } catch {
    return null;
  }
};

export const unwrap = (response) => response?.data ?? response ?? {};

/** Clinic axios interceptor rejects with a string, not the Axios error object. */
/** REC-05.02 — open a search row to case paper or the appointment. Never the repertory. */
export const openReceptionPatientRow = async (patientId, navigate) => {
  const id = Number(patientId);
  const fallback = id ? `/reception/case-paper?patientId=${id}` : "/reception/case-paper";
  if (!id) {
    navigate(fallback);
    return;
  }
  try {
    const body = unwrap(await getReceptionPatientOpen(id));
    const data = body.data || body.Data || body;
    const path = String(data.path || data.Path || "");
    const destination = String(data.destination || data.Destination || "").toLowerCase();
    if (!path || /patientboard|repertor/i.test(path) || destination === "repertory") {
      navigate(fallback);
      return;
    }
    navigate(path);
  } catch {
    navigate(fallback);
  }
};

export const apiMessage = (err, fallback) => {
  if (typeof err === "string" && err.trim()) return err;
  const data = err?.response?.data;
  const msg = data?.message ?? data?.Message ?? data?.title ?? data?.Title;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
};
