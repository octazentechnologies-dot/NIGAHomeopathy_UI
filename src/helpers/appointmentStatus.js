export const normalizeAppointmentStatus = (status) => String(status ?? "").trim().toUpperCase();

export const isAppointmentCompleted = (status) => normalizeAppointmentStatus(status) === "COMPLETED";

export const isAppointmentCancelled = (status) => normalizeAppointmentStatus(status) === "CANCELLED";

export const COMPLETED_APPOINTMENT_LOCKED_MESSAGE = "Completed appointments cannot be rescheduled or cancelled.";
