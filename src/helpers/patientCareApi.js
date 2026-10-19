import { apiHelpers } from "./api_helper";

const api = apiHelpers.nigahomeo;

export const listDeliveryAddresses = () => api.get("/Patient/DeliveryAddresses", null);
export const saveDeliveryAddress = (payload, id) =>
  id ? api.put(`/Patient/DeliveryAddresses/${id}`, payload) : api.post("/Patient/DeliveryAddresses", payload);
export const deleteDeliveryAddress = (id) => api.delete(`/Patient/DeliveryAddresses/${id}`);

export const listPatientReminders = () => api.get("/Patient/Reminders", null);
export const savePatientReminder = (payload, id) =>
  id ? api.put(`/Patient/Reminders/${id}`, payload) : api.post("/Patient/Reminders", payload);
export const deletePatientReminder = (id) => api.delete(`/Patient/Reminders/${id}`);

export const listPatientAppointmentRequests = () => api.get("/Patient/AppointmentRequests", null);
export const createPatientAppointmentRequest = (payload) => api.post("/Patient/AppointmentRequests", payload);
export const cancelPatientAppointmentRequest = (id) => api.delete(`/Patient/AppointmentRequests/${id}`);
export const respondPatientAppointmentRequest = (id, action) =>
  api.post(`/Patient/AppointmentRequests/${id}/Respond`, { action });

export const listWaitlistOffers = (params) => api.get("/Waitlist/Offers", params || {});
export const acceptWaitlistOffer = (id) => api.post(`/Patient/Waitlist/Offers/${id}/Accept`, {});

export const listPatientVisits = (params) => api.get("/Patient/Visits", params || {});
export const checkInVisit = (patientAppId, status) =>
  api.post(`/Patient/Visits/${patientAppId}/CheckIn`, { status });
