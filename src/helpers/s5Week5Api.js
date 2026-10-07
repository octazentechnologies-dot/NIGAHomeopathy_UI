import { apiHelpers } from "./api_helper";
import { s4Message, unwrapS4 } from "./s4Week4Api";

const nigahomeoAPI = apiHelpers.nigahomeo;

export { s4Message, unwrapS4 };

export const listSmsTemplates = () => nigahomeoAPI.get("/Sms/Templates", null);
export const saveSmsTemplate = (payload) => nigahomeoAPI.post("/Sms/Templates", payload);
export const listSmsEvents = () => nigahomeoAPI.get("/Sms/Events", null);
export const saveSmsPreference = (payload) => nigahomeoAPI.put("/Sms/Preferences", payload);
export const listNotifications = () => nigahomeoAPI.get("/Notifications", null);
export const patchNotification = (id, isRead = true) =>
  nigahomeoAPI.patch(`/Notifications/${id}?isRead=${isRead ? "true" : "false"}`, {});
export const adminOverview = () => nigahomeoAPI.get("/AdminDashboard/Overview", null);
export const adminDashboardSummary = (params) => nigahomeoAPI.get("/AdminDashboard/Summary", params || {});
export const followUpDue = () => nigahomeoAPI.get("/Reports/FollowUpDue", null);
export const followUpSummary = () => nigahomeoAPI.get("/Reports/FollowUpSummary", null);
export const clinicPerformance = (params) => nigahomeoAPI.get("/Reports/ClinicPerformance", params || {});
export const exportReconciliation = () => nigahomeoAPI.get("/Reports/Reconciliation/Export", null);
export const exportSettlements = () => nigahomeoAPI.get("/Reports/Settlements/Export", null);
export const exportPayouts = () => nigahomeoAPI.get("/Reports/Payouts/Export", null);
export const medicineReport = () => nigahomeoAPI.get("/Reports/MedicineOrders", null);
export const earningsBuckets = (params) => nigahomeoAPI.get("/Earnings/Buckets", params || {});
export const exportUsers = () => nigahomeoAPI.get("/Admin/Users/Export", null);
export const importUsers = (payload) => nigahomeoAPI.post("/Admin/Users/Import", payload);
export const securityPosture = () => nigahomeoAPI.get("/Security/Posture", null);
export const whatsAppBulk = () => nigahomeoAPI.get("/WhatsApp/Bulk", null);
export const whatsAppAudience = () => nigahomeoAPI.get("/WhatsApp/Audience", null);
export const registerDevice = (payload) => nigahomeoAPI.post("/Devices/Register", payload);
export const listDoctorReminders = (params) => nigahomeoAPI.get("/Doctor/Reminders", params || {});
export const createDoctorReminder = (payload) =>
  nigahomeoAPI.post("/Doctor/Reminders", payload, { returnErrorBody: true });
export const updateDoctorReminder = (id, payload) => nigahomeoAPI.put(`/Doctor/Reminders/${id}`, payload);
export const deleteDoctorReminder = (id) => nigahomeoAPI.delete(`/Doctor/Reminders/${id}`);
export const practiceReport = (params) => nigahomeoAPI.get("/Reports/Doctor/Practice", params || {});
export const followUpReport = (params) => nigahomeoAPI.get("/Reports/Doctor/FollowUps", params || {});
export const updateFollowUpTask = (taskId, payload) => nigahomeoAPI.put(`/Reports/Doctor/FollowUps/${taskId}`, payload);
export const listMyDoctorReviews = () => nigahomeoAPI.get("/Doctor/Reviews", null);
export const saveReviewReply = (reviewId, reply) => nigahomeoAPI.put(`/Doctor/Reviews/${reviewId}/Reply`, { reply });
export const listAdminReviews = () => nigahomeoAPI.get("/Admin/Reviews", null);
export const getPharmacyConfig = (pharmacyPartnerId) => nigahomeoAPI.get(`/Pharmacy/${pharmacyPartnerId}/Config`, null);
export const savePharmacyConfig = (pharmacyPartnerId, payload) =>
  nigahomeoAPI.put(`/Pharmacy/${pharmacyPartnerId}/Config`, payload);
export const setAdminReviewStatus = (reviewId, status, note) =>
  nigahomeoAPI.put(`/Admin/Reviews/${reviewId}/Status`, { status, note });
export const earningsReport = (params) => nigahomeoAPI.get("/Reports/Doctor/Earnings", params || {});
export const patientMedicineHistory = () => nigahomeoAPI.get("/Patient/MedicineOrders/History", null);
export const reviewMedicineOrder = (orderId, rating, comment) =>
  nigahomeoAPI.post(`/MedicineOrders/${orderId}/Review`, { rating, comment });

export const downloadCsvEnvelope = (envelope, fallbackName) => {
  const csv = envelope?.csv || envelope?.Csv || "";
  if (!csv) return false;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = envelope.fileName || envelope.FileName || fallbackName || "report.csv";
  a.click();
  URL.revokeObjectURL(url);
  return true;
};
