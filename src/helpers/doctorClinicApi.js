import { apiHelpers } from "./api_helper";

const api = apiHelpers.nigahomeo;

export const unwrapClinic = (response) => {
  const body = response?.data !== undefined ? response.data : response;
  if (body?.data !== undefined) return body.data;
  if (body?.Data !== undefined) return body.Data;
  return body;
};

export const clinicMessage = (error) => {
  const d = error?.response?.data;
  const msg = d?.message ?? d?.Message ?? d?.title;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof error === "string") return error;
  return error?.message || "Request failed.";
};

/* CareLink */
export const listCareLinks = () => api.get("/Doctor/CareLinks", null);
export const createCareLink = (payload) => api.post("/Doctor/CareLinks", payload);
export const respondCareLink = (id, status) => api.post(`/Doctor/CareLinks/${id}/Respond`, { status });
export const careLinkOpinion = (id, opinion) => api.post(`/Doctor/CareLinks/${id}/Opinion`, { opinion });
export const careLinkPackage = (id) => api.get(`/Doctor/CareLinks/${id}/Package`, null);
export const careLinkInfoRequest = (id, payload) => api.post(`/Doctor/CareLinks/${id}/InfoRequest`, payload);
export const doctorDirectory = (params) => api.get("/Doctor/Directory", params || {});

/* Appointment requests */
export const listAppointmentRequests = (status) =>
  api.get("/Doctor/AppointmentRequests", status ? { status } : null);
export const acceptAppointmentRequest = (id) => api.post(`/Doctor/AppointmentRequests/${id}/Accept`, null);
export const declineAppointmentRequest = (id, reason) =>
  api.post(`/Doctor/AppointmentRequests/${id}/Decline`, { reason });
export const proposeAppointmentRequest = (id, payload) =>
  api.post(`/Doctor/AppointmentRequests/${id}/Propose`, payload);

/* Pharmacy queries */
export const listPharmacyQueries = () => api.get("/Doctor/PharmacyQueries", null);
export const createPharmacyQuery = (payload) => api.post("/Doctor/PharmacyQueries", payload);
export const replyPharmacyQuery = (id, reply) => api.post(`/Doctor/PharmacyQueries/${id}/Reply`, { reply });

/* Follow-ups (doctor mutations) */
export const listDoctorFollowUps = (params) => api.get("/Doctor/FollowUps", params || {});
export const completeDoctorFollowUp = (id, note) =>
  api.post(`/Doctor/FollowUps/${id}/Complete`, note != null ? { note } : {});
export const reopenDoctorFollowUp = (id) => api.post(`/Doctor/FollowUps/${id}/Reopen`, null);

/* Earnings */
export const doctorEarningsPayouts = (params) => api.get("/Earnings/Payouts", params || {});

/* Erx catalogue */
export const searchErxRemedies = (search, take = 40) =>
  api.get("/Erx/Remedies", { search: search || undefined, take });

/* Tele */
export const teleRunningLate = (teleSessionId, minutes) =>
  api.post(`/Tele/Sessions/${teleSessionId}/RunningLate`, minutes != null ? { minutes } : {});

/* Public config */
export const getPublicAppConfig = () => api.get("/Public/AppConfig", null);
