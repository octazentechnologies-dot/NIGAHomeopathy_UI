import { apiHelpers } from "./api_helper";

const nigahomeoAPI = apiHelpers.nigahomeo;

/** Unwrap S4 Week 4 API payloads ({ success, data } or nested arrays). */
export const unwrapS4 = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (response?.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data;
  }
  return response?.data ?? response ?? null;
};

export const s4Message = (error) => {
  if (typeof error === "string" && error.trim()) return error;
  const data = error?.response?.data ?? error?.data;
  const msg =
    data?.message ||
    data?.Message ||
    data?.title ||
    data?.Title ||
    error?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  return "Something went wrong. Please try again.";
};

/* Fees / payments */
export const getPublicFee = (doctorId) => nigahomeoAPI.get(`/Fees/Public/${doctorId}`, null);
export const saveFee = (payload) => nigahomeoAPI.put("/Fees", payload);
export const feeHistory = (doctorId) => nigahomeoAPI.get("/Fees/History", { doctorId });
export const createConsultOrder = (payload) => nigahomeoAPI.post("/Payments/ConsultOrders", payload);
export const appointmentPayment = (patientAppId) =>
  nigahomeoAPI.get(`/Payments/Appointments/${patientAppId}`, null);
export const collectAtReception = (payload) => nigahomeoAPI.post("/Payments/CollectAtReception", payload);
export const getInvoiceByPayment = (paymentOrderId) =>
  nigahomeoAPI.get(`/Invoices/ByPayment/${paymentOrderId}`, null);
export const createInvoiceByPayment = (paymentOrderId) =>
  nigahomeoAPI.post(`/Invoices/ByPayment/${paymentOrderId}`, null);
export const listRefunds = () => nigahomeoAPI.get("/Refunds", null);
export const createRefund = (payload) => nigahomeoAPI.post("/Refunds", payload);
export const previewRefundPolicy = (paymentOrderId) =>
  nigahomeoAPI.get(`/Refunds/Policy/${paymentOrderId}`, null);

/* Account finance */
export const getLedger = (params) => nigahomeoAPI.get("/Account/Ledger", params || {});
export const exportLedger = (params) => nigahomeoAPI.get("/Account/Ledger/Export", params || {});
export const getReconciliation = (params) => nigahomeoAPI.get("/Account/Reconciliation", params || {});
export const getMedicineLedger = (params) => nigahomeoAPI.get("/Account/MedicineLedger", params || {});
export const listSettlements = () => nigahomeoAPI.get("/Account/Settlements", null);
export const createSettlement = (payload) => nigahomeoAPI.post("/Account/Settlements", payload);
export const settlementDetail = (id) => nigahomeoAPI.get(`/Account/Settlements/${id}`, null);
export const listPayouts = () => nigahomeoAPI.get("/Account/Payouts", null);
export const requestPayoutOtp = (id) => nigahomeoAPI.post(`/Account/Payouts/${id}/Otp`, null);
export const approvePayout = (id, payload) => nigahomeoAPI.post(`/Account/Payouts/${id}/Approve`, payload);
export const rejectPayout = (id, payload) => nigahomeoAPI.post(`/Account/Payouts/${id}/Reject`, payload);
export const listExceptions = (status) =>
  nigahomeoAPI.get("/Account/Exceptions", status ? { status } : { status: "OPEN" });
export const retryException = (id) => nigahomeoAPI.post(`/Account/Exceptions/${id}/Retry`, null);
export const resolveException = (id, payload) =>
  nigahomeoAPI.post(`/Account/Exceptions/${id}/Resolve`, payload);
export const getTaxReport = (params) => nigahomeoAPI.get("/Account/Tax", params || {});
export const listPayees = () => nigahomeoAPI.get("/Account/Payees", null);
export const updatePayee = (id, payload) => nigahomeoAPI.put(`/Account/Payees/${id}`, payload);
export const requestPayeeBankOtp = (id) => nigahomeoAPI.post(`/Account/Payees/${id}/BankOtp`, null);
export const getClinicCollections = (params) =>
  nigahomeoAPI.get("/Account/ClinicCollections", params || {});
/** DMO-10.02 — doctor mobile earnings summary */
export const earningsSummary = (params) => nigahomeoAPI.get("/Earnings/Summary", params || {});
export const accountDoctorEarnings = (params) => nigahomeoAPI.get("/Account/DoctorEarnings", params || {});

/* Pharmacy / medicine */
export const onboardPharmacy = (payload) => nigahomeoAPI.post("/Pharmacy/Onboard", payload);
export const sweepPharmacyLicences = () => nigahomeoAPI.post("/Pharmacy/Licences/Sweep", null);
export const listPharmacySellers = (area) =>
  nigahomeoAPI.get("/Pharmacy/Sellers", area ? { area } : null);
export const listPharmacyPartners = () => nigahomeoAPI.get("/Pharmacy/Partners", null);
export const activatePharmacy = (id) => nigahomeoAPI.post(`/Pharmacy/${id}/Activate`, null);
export const pharmacyQueue = () => nigahomeoAPI.get("/Pharmacy/Orders", null);
export const markMedicineReady = (id) => nigahomeoAPI.post(`/MedicineOrders/${id}/Ready`, null);
export const dispatchMedicine = (id) => nigahomeoAPI.post(`/MedicineOrders/${id}/Dispatch`, null);
export const grantMedicineConsent = (id) => nigahomeoAPI.post(`/MedicineOrders/${id}/Consent`, null);
export const acceptMedicineQuote = (id) => nigahomeoAPI.post(`/MedicineOrders/${id}/AcceptQuote`, null);
export const createMedicineOrder = (payload) => nigahomeoAPI.post("/MedicineOrders", payload);
export const createMedicinePayment = (payload) => nigahomeoAPI.post("/Payments/MedicineOrders", payload);
export const patientPayments = () => nigahomeoAPI.get("/Patient/Payments", null);
export const savePharmacyRouting = (payload) => nigahomeoAPI.put("/Pharmacy/Routing", payload);
export const medicineAcceptOtp = (id) => nigahomeoAPI.post(`/MedicineOrders/${id}/AcceptOtp`, null);
export const acceptMedicineOrder = (id, payload) =>
  nigahomeoAPI.post(`/MedicineOrders/${id}/Accept`, payload);
export const rejectMedicineOrder = (id, payload) =>
  nigahomeoAPI.post(`/MedicineOrders/${id}/Reject`, payload);
export const quoteMedicineOrder = (id, payload) =>
  nigahomeoAPI.post(`/MedicineOrders/${id}/Quote`, payload);
export const medicineTracking = (id) => nigahomeoAPI.get(`/MedicineOrders/${id}/Tracking`, null);
export const patientMedicineOrders = () => nigahomeoAPI.get("/Patient/MedicineOrders", null);
export const listMedicineExceptions = () => nigahomeoAPI.get("/Admin/HomemedsExceptions", null);
export const rerouteMedicine = (orderId, pharmacyId) =>
  nigahomeoAPI.post(`/Admin/HomemedsExceptions/${orderId}/Reroute?pharmacyId=${pharmacyId}`, null);

/* Trust / reviews (TRU) */
export const trustMyStatus = () => nigahomeoAPI.get("/Trust/MyStatus", null);
export const listTrustQueue = (status) =>
  nigahomeoAPI.get("/Trust/Queue", status ? { status } : { status: "All" });
export const getTrust = (doctorId) => nigahomeoAPI.get(`/Trust/${doctorId}`, null);
export const decideTrust = (doctorId, payload) => nigahomeoAPI.post(`/Trust/${doctorId}/Decide`, payload);
export const postReview = (payload) => nigahomeoAPI.post("/Reviews", payload);
export const listDoctorReviews = (doctorId) => nigahomeoAPI.get(`/Reviews/Doctor/${doctorId}`, null);
export const myReviews = () => nigahomeoAPI.get("/Reviews/Mine", null);
export const appealReview = (id, payload) => nigahomeoAPI.post(`/Reviews/${id}/Appeal`, payload);
export const listReviewAppeals = () => nigahomeoAPI.get("/Reviews/Appeals", null);
export const resolveReviewAppeal = (id, payload) =>
  nigahomeoAPI.post(`/Reviews/Appeals/${id}/Resolve`, payload);
export const rankingExplain = (doctorId) => nigahomeoAPI.get(`/Doctors/RankingExplain/${doctorId}`, null);

/* eRx (ERX) */
export const erxPotencies = () => nigahomeoAPI.get("/Erx/Potencies", null);
export const updateErxRemedyLine = (id, payload) => nigahomeoAPI.put(`/Erx/RemedyLines/${id}`, payload);
export const erxByAppointment = (id) => nigahomeoAPI.get(`/Erx/ByAppointment/${id}`, null);
export const signErx = (payload) => nigahomeoAPI.post("/Erx/Sign", payload);
export const erxHistory = (params) => nigahomeoAPI.get("/Erx/History", params || {});
export const erxPatient = (appointmentId) => nigahomeoAPI.get(`/Erx/Patient/${appointmentId}`, null);
export const erxPdf = (id) => nigahomeoAPI.get(`/Erx/${id}/Pdf`, { responseType: "blob" });
export const createErxRefill = (payload) => nigahomeoAPI.post("/Erx/Refills", payload);
export const cloneMedicineRefill = (refillId) => nigahomeoAPI.post(`/MedicineOrders/Refill/${refillId}`, null);
export const listErxRefills = (status) => nigahomeoAPI.get("/Erx/Refills", status ? { status } : null);
export const approveErxRefill = (id, payload) => nigahomeoAPI.post(`/Erx/Refills/${id}/Approve`, payload);
export const rejectErxRefill = (id, payload) => nigahomeoAPI.post(`/Erx/Refills/${id}/Reject`, payload);

/* Continuity (CON) */
export const getPatientTimeline = () => nigahomeoAPI.get("/Patient/Timeline", null);
export const getPatientVisits = () => nigahomeoAPI.get("/Patient/Visits", null);
export const getConsultNote = (patientAppId) =>
  nigahomeoAPI.get(`/Patient/Consultations/${patientAppId}/Note`, null);
export const uploadPatientDocument = (payload) => {
  const file = payload instanceof File ? payload : payload?.file;
  if (file instanceof File) {
    const body = new FormData();
    body.append("file", file);
    return apiHelpers.nigahomeoMultipart.post("/Patient/Documents", body);
  }
  return nigahomeoAPI.post("/Patient/Documents", payload);
};
export const listTeleChat = (sessionId) => nigahomeoAPI.get(`/Tele/Chat/${sessionId}`, null);
export const postTeleChat = (payload) => nigahomeoAPI.post("/Tele/Chat", payload);
export const rejoinTeleSession = (sessionId) => nigahomeoAPI.post(`/Tele/Sessions/${sessionId}/Rejoin`, null);
export const getConsultationSummary = (patientAppId) => nigahomeoAPI.get(`/Tele/Summary/${patientAppId}`, null);
export const postFollowUp = (payload) => nigahomeoAPI.post("/Patient/FollowUps", payload);
export const getPatientFollowUps = () => nigahomeoAPI.get("/Patient/FollowUps", null);
export const completeFollowUp = (taskId) => nigahomeoAPI.post(`/Patient/FollowUps/${taskId}/Complete`, null);
export const postDiaryEntry = (payload) => nigahomeoAPI.post("/Patient/Diary", payload);
export const getPatientDiary = () => nigahomeoAPI.get("/Patient/Diary", null);
export const updateDiaryEntry = (id, payload) => nigahomeoAPI.put(`/Patient/Diary/${id}`, payload);
export const getPatientProgress = () => nigahomeoAPI.get("/Patient/Progress", null);
export const getPatientConsents = () => nigahomeoAPI.get("/Patient/Consents", null);
export const withdrawConsent = (id) => nigahomeoAPI.post(`/Patient/Consents/${id}/Withdraw`, null);
export const grantPatientConsent = (consentTypeId) =>
  nigahomeoAPI.post(`/Patient/Consents/Types/${consentTypeId}/Grant`, null);
export const listPatientDocuments = () => nigahomeoAPI.get("/Patient/Documents", null);
export const openPatientDocument = (documentId) =>
  nigahomeoAPI.get(`/Patient/Documents/${documentId}`, { responseType: "blob" });
export const deletePatientDocument = (documentId) => nigahomeoAPI.delete(`/Patient/Documents/${documentId}`);
export const postDataRequest = (payload) => nigahomeoAPI.post("/Patient/DataRequests", payload);
export const getPatientProfileS4 = () => nigahomeoAPI.get("/Patient/Profile", null);
export const putPatientProfileS4 = (payload) => nigahomeoAPI.put("/Patient/Profile", payload);
