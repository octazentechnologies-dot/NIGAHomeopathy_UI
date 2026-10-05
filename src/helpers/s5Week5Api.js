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
export const registerDevice = (payload) => nigahomeoAPI.post("/Devices/Register", payload);

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
