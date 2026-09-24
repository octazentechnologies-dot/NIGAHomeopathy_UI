import moment from "moment";
import { formatApiDate } from "./appointmentSlotHelper";

export const coerceAppointmentTime = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const hour = value.hour ?? value.Hour;
    const minute = value.minute ?? value.Minute;
    if (hour == null) return "";
    const second = value.second ?? value.Second ?? 0;
    return `${String(hour).padStart(2, "0")}:${String(minute ?? 0).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  }
  return String(value);
};

export const formatRescheduleDate = (value) => {
  const iso = formatApiDate(value);
  if (!iso) return "—";
  return moment(iso, "YYYY-MM-DD").format("DD-MM-YYYY");
};

export const formatRescheduleTime = (value) => {
  const raw = coerceAppointmentTime(value);
  if (!raw) return "—";
  const parsed = moment(raw, ["HH:mm:ss", "HH:mm", "h:mm A", "hh:mm A"], true);
  return parsed.isValid() ? parsed.format("h:mm A") : raw;
};

export const readRescheduleFailure = (error) => {
  if (typeof error === "string") {
    return { message: error.trim() || "Could not reschedule.", alternatives: [] };
  }
  const data = error?.data && typeof error.data === "object" ? error.data : {};
  const message = error?.message || data.message || data.Message || "Could not reschedule.";
  const raw = data.alternatives || data.Alternatives || [];
  const alternatives = (Array.isArray(raw) ? raw : [])
    .map((slot) => {
      const time = coerceAppointmentTime(slot?.time || slot?.Time);
      if (!time) return null;
      return {
        time,
        label: slot?.label || slot?.Label || formatRescheduleTime(time),
      };
    })
    .filter(Boolean);
  return { message, alternatives };
};
