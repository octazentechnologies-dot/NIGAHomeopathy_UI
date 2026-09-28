import axios from "axios";
import { api } from "../config";
import Avatar1 from "../assets/images/users/avatar-1.jpg";

/** Anonymous New-API client for public find-doctor / booking / policies / articles. */
const publicClient = axios.create({
  baseURL: api.New_API_Base_URL,
  headers: { "Content-Type": "application/json" },
});

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

const apiErrorMessage = (err) => {
  const d = err?.response?.data;
  if (typeof d === "string" && d.trim()) return d;
  const msg = d?.message ?? d?.Message ?? d?.title ?? d?.Title;
  if (typeof msg === "string" && msg.trim()) return msg;
  return err?.message || "Request failed.";
};

publicClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const wrapped = new Error(apiErrorMessage(err));
    wrapped.response = err.response;
    wrapped.status = err.response?.status;
    return Promise.reject(wrapped);
  }
);

export const toIsoDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const slotToHHmm = (slot) => {
  const raw = String(slot || "").trim();
  const hhmmss = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmss) return `${String(Number(hhmmss[1])).padStart(2, "0")}:${hhmmss[2]}`;
  const ampm = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (!ampm) return raw;
  let hour = Number(ampm[1]);
  const minute = ampm[2];
  const period = ampm[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
};

export const mapPublicDoctorCard = (row, fallback = {}) => {
  const id = row?.doctorId ?? row?.DoctorId ?? fallback.id;
  const name = row?.displayName ?? row?.DisplayName ?? fallback.name ?? "Doctor";
  const qualification = row?.qualification ?? row?.Qualification ?? fallback.degree ?? "BHMS";
  const city = row?.city ?? row?.City ?? fallback.location ?? "";
  const clinicName = row?.clinicName ?? row?.ClinicName ?? fallback.clinicName ?? "";
  const inClinic = Number(row?.consultFeeInClinic ?? row?.ConsultFeeInClinic ?? fallback.inClinic ?? 0);
  const tele = Number(row?.consultFeeTele ?? row?.ConsultFeeTele ?? fallback.tele ?? 0);
  const verified = Boolean(row?.verified ?? row?.Verified ?? true);
  const isOnline = Boolean(row?.isOnline ?? row?.IsOnline);
  const rankingSummary = row?.rankingSummary ?? row?.RankingSummary ?? "";
  const workingHoursNote = row?.workingHoursNote ?? row?.WorkingHoursNote ?? fallback.timings?.weekdays ?? "10:00-18:00";
  const photoPath = row?.photoPath ?? row?.PhotoPath;
  return {
    ...fallback,
    id,
    name,
    degree: qualification,
    credentials: qualification,
    experience: rankingSummary || fallback.experience || "",
    specialties: qualification || "Homoeopathy",
    specialtiesList: fallback.specialtiesList || [qualification || "Homoeopathy"],
    rating: Number(row?.averageRating ?? row?.AverageRating ?? 0),
    reviews: Number(row?.reviewCount ?? row?.ReviewCount ?? 0),
    location: city,
    clinicName,
    clinicAddress: [clinicName, city].filter(Boolean).join(", "),
    mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(city || clinicName || "India")}`,
    inClinic,
    tele,
    available: isOnline ? "today" : "tomorrow",
    image: photoPath || fallback.image || Avatar1,
    verified,
    verificationStatus: row?.verificationStatus ?? row?.VerificationStatus ?? (verified ? "Verified" : "Pending"),
    rankingSummary,
    rankingReasons: row?.rankingReasons ?? row?.RankingReasons ?? fallback.rankingReasons ?? [],
    workingHoursNote,
    about: rankingSummary || fallback.about || `${name} is a verified homeopathy practitioner.`,
    education: qualification,
    specialtyLine: rankingSummary || "Classical homeopathy",
    languages: fallback.languages || "Languages: English, Hindi",
    timings: {
      weekdays: workingHoursNote,
      sunday: fallback.timings?.sunday || "Closed",
    },
    expertise: fallback.expertise || [qualification || "Homeopathy"],
    phone: fallback.phone || "",
    isOnline,
  };
};

export const listPublicDoctors = async (params = {}) => {
  const res = await publicClient.get("/Public/Doctors", { params });
  const payload = unwrap(res);
  return {
    totalRecords: payload.totalRecords ?? payload.TotalRecords ?? 0,
    data: payload.data ?? payload.Data ?? [],
  };
};

export const getPublicDoctor = async (id) => {
  const res = await publicClient.get(`/Public/Doctors/${id}`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

export const getPublicDoctorRanking = async (id) => {
  const res = await publicClient.get(`/Public/Doctors/${id}/Ranking`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

export const getPublicDoctorSlots = async (id, date) => {
  const res = await publicClient.get(`/Public/Doctors/${id}/Slots`, {
    params: { date: toIsoDate(date) },
  });
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

export const requestPatientAuthOtp = async (mobile) => {
  const res = await publicClient.post("/PatientAuth/RequestOtp", { mobile });
  return unwrap(res);
};

export const verifyPatientAuthOtp = async ({ mobile, code }) => {
  const res = await publicClient.post("/PatientAuth/VerifyOtp", { mobile, code });
  return unwrap(res);
};

export const createPublicBooking = async (doctorId, body) => {
  const res = await publicClient.post(`/Public/Doctors/${doctorId}/Bookings`, body);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

/** PAY-01 / PAY-05 — public consult fee (includes payAtClinicEnabled). */
export const getPublicFee = async (doctorId) => {
  const id = Number(doctorId);
  if (!id) throw new Error("doctorId is required.");
  const res = await publicClient.get(`/Fees/Public/${id}`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

/** PAT-18 / PAY — public checkout after booking hold (bookingToken, no JWT). */
export const createPublicConsultOrder = async (body) => {
  const res = await publicClient.post("/Payments/ConsultOrders", body);
  return unwrap(res);
};

/** TRU-05 — approved public reviews for a doctor profile. */
export const listPublicDoctorReviews = async (doctorId) => {
  const id = Number(doctorId);
  if (!id) throw new Error("doctorId is required.");
  const res = await publicClient.get(`/Reviews/Doctor/${id}`);
  const payload = unwrap(res);
  const data = payload.data ?? payload.Data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.reviews)) return data.reviews;
  return [];
};

export const getPublicBooking = async (bookingToken) => {
  const res = await publicClient.get(`/Public/Bookings/${bookingToken}`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

export const getPublicPolicy = async (policyType) => {
  const res = await publicClient.get(`/Public/Policies/${policyType}`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

/**
 * PAT-17.02 — Phase 8–15 booking review & consent APIs for Patient Mobile (same URLs as web).
 * Do not invent local paid/signed state; only use API fields.
 */
export const getBookingConsentPolicy = async () => {
  const policy = await getPublicPolicy("Booking");
  return {
    policyType: policy.policyType ?? policy.PolicyType ?? "Booking",
    version: String(policy.version ?? policy.Version ?? ""),
    title: policy.title ?? policy.Title ?? "Booking consent",
    bodyHtml: policy.bodyHtml ?? policy.BodyHtml ?? "",
    effectiveAt: policy.effectiveAt ?? policy.EffectiveAt ?? null,
  };
};

/** PAT-17.02 — create booking hold with consentPolicyVersion from review step. */
export const createBookingWithConsent = async (doctorId, body) => {
  const version = body?.consentPolicyVersion ?? body?.ConsentPolicyVersion;
  if (!version) {
    throw new Error("consentPolicyVersion is required (load Booking policy first).");
  }
  return createPublicBooking(doctorId, body);
};

/** PAT-17.02 — re-read booking after confirm (paymentStatus from API only). */
export const getBookingReviewStatus = async (bookingToken) => {
  const booking = await getPublicBooking(bookingToken);
  return {
    patientAppId: booking.patientAppId ?? booking.PatientAppId,
    doctorId: booking.doctorId ?? booking.DoctorId,
    patientId: booking.patientId ?? booking.PatientId,
    appointmentDate: booking.appointmentDate ?? booking.AppointmentDate,
    appointmentTime: booking.appointmentTime ?? booking.AppointmentTime,
    status: booking.status ?? booking.Status,
    visitType: booking.visitType ?? booking.VisitType,
    consultMode: booking.consultMode ?? booking.ConsultMode,
    paymentStatus: booking.paymentStatus ?? booking.PaymentStatus,
    isTele: Boolean(booking.isTele ?? booking.IsTele),
    bookingToken: booking.bookingToken ?? booking.BookingToken ?? bookingToken,
    holdExpiresAt: booking.holdExpiresAt ?? booking.HoldExpiresAt,
    consentPolicyVersion: booking.consentPolicyVersion ?? booking.ConsentPolicyVersion,
    consultFee: booking.consultFee ?? booking.ConsultFee,
  };
};

/**
 * PAT-19.02 — Phase 8–15 payment status for Patient Mobile (same URL as web).
 * GET /api/Public/Bookings/{bookingToken} — no JWT. Do not invent paid/failed locally.
 */
export const mapPaymentStatusKind = (raw) => {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "PAID" || s === "WAIVED") return "paid";
  if (s === "FAILED") return "failed";
  // PENDING, UNPAID, REFUND_PENDING, REFUND*, empty → pending for patient confirmation
  return "pending";
};

export const paymentStatusLabel = (kind, raw) => {
  if (kind === "paid") return "Paid";
  if (kind === "failed") return "Failed";
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "PENDING" || s === "UNPAID" || !s) return "Pending — pay at the clinic";
  return String(raw);
};

export const getPaymentStatus = async (bookingToken) => {
  if (!bookingToken || !String(bookingToken).trim()) {
    throw new Error("bookingToken is required.");
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const offline = new Error("You appear to be offline. Check your connection and try again.");
    offline.code = "OFFLINE";
    throw offline;
  }
  const booking = await getPublicBooking(bookingToken);
  const paymentStatus = booking.paymentStatus ?? booking.PaymentStatus ?? "PENDING";
  const kind = mapPaymentStatusKind(paymentStatus);
  return {
    patientAppId: booking.patientAppId ?? booking.PatientAppId,
    doctorId: booking.doctorId ?? booking.DoctorId,
    patientId: booking.patientId ?? booking.PatientId,
    appointmentDate: booking.appointmentDate ?? booking.AppointmentDate,
    appointmentTime: booking.appointmentTime ?? booking.AppointmentTime,
    status: booking.status ?? booking.Status,
    visitType: booking.visitType ?? booking.VisitType,
    consultMode: booking.consultMode ?? booking.ConsultMode,
    paymentStatus,
    paymentKind: kind,
    paymentLabel: paymentStatusLabel(kind, paymentStatus),
    isTele: Boolean(booking.isTele ?? booking.IsTele),
    bookingToken: booking.bookingToken ?? booking.BookingToken ?? bookingToken,
    holdExpiresAt: booking.holdExpiresAt ?? booking.HoldExpiresAt,
    consentPolicyVersion: booking.consentPolicyVersion ?? booking.ConsentPolicyVersion,
    consultFee: booking.consultFee ?? booking.ConsultFee,
  };
};

/**
 * PAT-20.02 — Phase 8–15 appointment detail for Patient Mobile (same URLs as web).
 * Core visit fields: GET /api/Public/Bookings/{bookingToken} (no JWT).
 * Change log: GET /api/PatientAppointment/ChangeLog/{patientAppId} (Bearer).
 * Tele summary: GET /api/Tele/Summary/{patientAppId} (Bearer).
 * Do not invent local paid/signed state — paymentStatus only from API.
 */
export const getAppointmentDetail = async (bookingToken) => getPaymentStatus(bookingToken);

const authedGet = async (path, accessToken) => {
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Patient or doctor access token is required for this appointment detail section.");
  }
  const res = await publicClient.get(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

/** PAT-20.02 — change log for the visit (owning patient or treating doctor JWT). */
export const fetchAppointmentChangeLog = async (patientAppId, accessToken) => {
  const id = Number(patientAppId);
  if (!id) throw new Error("patientAppId is required.");
  const rows = await authedGet(`/PatientAppointment/ChangeLog/${id}`, accessToken);
  return Array.isArray(rows) ? rows : [];
};

/** PAT-20.02 — tele consultation summaries for the visit. */
export const fetchTeleConsultationSummary = async (patientAppId, accessToken) => {
  const id = Number(patientAppId);
  if (!id) throw new Error("patientAppId is required.");
  const rows = await authedGet(`/Tele/Summary/${id}`, accessToken);
  return Array.isArray(rows) ? rows : [];
};

/**
 * PAT-20.02 — full appointment detail screen payload.
 * Always loads public booking status; changelog + tele summary when accessToken is provided.
 */
export const loadAppointmentDetailScreen = async (bookingToken, { accessToken } = {}) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const offline = new Error("You appear to be offline. Check your connection and try again.");
    offline.code = "OFFLINE";
    throw offline;
  }
  const detail = await getAppointmentDetail(bookingToken);
  const patientAppId = detail.patientAppId;
  let changeLog = [];
  let teleSummaries = [];
  let changeLogError = "";
  let teleSummaryError = "";
  if (accessToken && patientAppId) {
    try {
      changeLog = await fetchAppointmentChangeLog(patientAppId, accessToken);
    } catch (err) {
      changeLogError = err?.message || "Could not load change log.";
    }
    try {
      teleSummaries = await fetchTeleConsultationSummary(patientAppId, accessToken);
    } catch (err) {
      teleSummaryError = err?.message || "Could not load tele summary.";
    }
  }
  return {
    detail,
    changeLog,
    teleSummaries,
    changeLogError,
    teleSummaryError,
    paymentStatus: detail.paymentStatus,
    paymentKind: detail.paymentKind,
    paymentLabel: detail.paymentLabel,
  };
};

/**
 * PAT-22.02 — Phase 8–15 cancel for Patient Mobile (same URL as web).
 * POST /api/PatientAppointment/CancelAppointment — Bearer required (owning patient or treating clinic).
 * reasonCode: PatientRequest | DoctorUnavailable | Duplicate | Other (Other needs reasonText).
 * Do not invent cancelled/refunded locally — status only from API response.
 */
export const CANCEL_REASON_CODES = [
  { value: "PatientRequest", label: "Patient request" },
  { value: "DoctorUnavailable", label: "Doctor unavailable" },
  { value: "Duplicate", label: "Duplicate" },
  { value: "Other", label: "Other" },
];

const assertOnline = () => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const offline = new Error("You appear to be offline. Check your connection and try again.");
    offline.code = "OFFLINE";
    throw offline;
  }
};

export const cancelPatientAppointment = async ({
  patientAppId,
  reasonCode,
  reasonText = "",
  accessToken,
} = {}) => {
  assertOnline();
  const id = Number(patientAppId);
  if (!id) throw new Error("patientAppId is required.");
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Sign in as the patient (or treating clinic) to cancel this visit.");
  }
  const code = String(reasonCode || "").trim();
  if (!CANCEL_REASON_CODES.some((r) => r.value === code)) {
    throw new Error("ReasonCode must be PatientRequest, DoctorUnavailable, Duplicate, or Other.");
  }
  if (code === "Other" && !String(reasonText || "").trim()) {
    throw new Error("ReasonText is required when ReasonCode is Other.");
  }
  const res = await publicClient.post(
    "/PatientAppointment/CancelAppointment",
    {
      patientAppId: id,
      reasonCode: code,
      reasonText: reasonText || "",
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const payload = unwrap(res);
  const appointment = payload.appointment ?? payload.Appointment ?? null;
  const status = appointment?.status ?? appointment?.Status ?? "CANCELLED";
  return {
    statusCode: payload.statusCode ?? payload.StatusCode ?? res.status,
    message:
      payload.message ??
      payload.Message ??
      "Appointment cancelled. The slot is free. No refund was sent.",
    appointment,
    status,
    cancelReasonCode:
      appointment?.cancelReasonCode ?? appointment?.CancelReasonCode ?? code,
    patientAppId: appointment?.patientAppId ?? appointment?.PatientAppId ?? id,
    refundPolicy: payload.refundPolicy ?? payload.RefundPolicy ?? null,
  };
};

/** PAT-22.02 — load visit for cancel screen (public booking + optional auth check). */
export const loadCancelAppointmentScreen = async (bookingToken, { accessToken } = {}) => {
  assertOnline();
  const detail = await getAppointmentDetail(bookingToken);
  const alreadyCancelled = String(detail.status || "").toUpperCase() === "CANCELLED";
  return {
    detail,
    alreadyCancelled,
    needsAuth: !accessToken,
  };
};

/**
 * PAT-24.02 — Phase 8–15 instant consult request for Patient Mobile (same URL as web).
 * POST /api/Tele/Instant — Bearer required. Status OFFERED | NO_DOCTOR from API only.
 * No patient poll URL — use queuePosition on this response. Do not invent paid/matched locally.
 */
export const mapInstantConsultStatusKind = (raw) => {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "OFFERED" || s === "ACCEPTED") return "matched";
  if (s === "NO_DOCTOR") return "no_doctor";
  if (s === "OPEN") return "queued";
  return "unknown";
};

export const instantConsultStatusLabel = (kind, raw, message) => {
  if (kind === "matched") {
    return String(raw || "").toUpperCase() === "ACCEPTED"
      ? "Doctor accepted — join when the room is ready"
      : "A doctor is available — offer sent";
  }
  if (kind === "no_doctor") return message || "No doctor is online.";
  if (kind === "queued") return "Waiting in the instant queue";
  return String(raw || message || "Unknown status");
};

export const requestInstantConsult = async ({
  patientId,
  contactName,
  contactMobile,
  accessToken,
} = {}) => {
  assertOnline();
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Sign in as the patient to request an instant consult.");
  }
  const mobile = String(contactMobile || "").trim();
  if (mobile.length < 8) {
    throw new Error("A valid contact mobile is required.");
  }
  const body = {
    contactName: String(contactName || "").trim() || "Patient",
    contactMobile: mobile,
  };
  if (patientId != null && Number(patientId) > 0) {
    body.patientId = Number(patientId);
  }
  const res = await publicClient.post("/Tele/Instant", body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = unwrap(res);
  const status = payload.status ?? payload.Status ?? "";
  const kind = mapInstantConsultStatusKind(status);
  const message = payload.message ?? payload.Message ?? "";
  return {
    success: Boolean(payload.success ?? payload.Success ?? true),
    instantConsultRequestId:
      payload.instantConsultRequestId ?? payload.InstantConsultRequestId ?? null,
    queuePosition: payload.queuePosition ?? payload.QueuePosition ?? null,
    status,
    statusKind: kind,
    statusLabel: instantConsultStatusLabel(kind, status, message),
    doctorId: payload.doctorId ?? payload.DoctorId ?? null,
    message,
  };
};

/** PAT-24.02 — public online flag for a doctor (anonymous). */
export const getPublicTeleAvailability = async (doctorId) => {
  assertOnline();
  const id = Number(doctorId);
  if (!id) throw new Error("doctorId is required.");
  const res = await publicClient.get(`/Tele/Availability/${id}`);
  const payload = unwrap(res);
  const data = payload.data ?? payload.Data ?? payload;
  return {
    doctorId: data.doctorId ?? data.DoctorId ?? id,
    isOnline: Boolean(data.isOnline ?? data.IsOnline),
    lastHeartbeat: data.lastHeartbeat ?? data.LastHeartbeat ?? null,
  };
};

/**
 * PAT-25.02 — Phase 8–15 queue & doctor offer for Patient Mobile.
 * There is no patient poll URL — queuePosition + status + doctorId come only from
 * POST /api/Tele/Instant (or the last API result passed into the screen).
 * Doctor offer list/accept: GET /Tele/Instant/Offers + POST …/Accept (doctor JWT).
 * Do not invent paid/matched/accepted locally.
 */
export const buildInstantQueueOfferView = (apiResult) => {
  if (!apiResult) {
    return {
      empty: true,
      hasOffer: false,
      queuePosition: null,
      status: "",
      statusKind: "unknown",
      statusLabel: "",
      doctorId: null,
      instantConsultRequestId: null,
      message: "",
    };
  }
  const status = apiResult.status ?? apiResult.Status ?? "";
  const kind = apiResult.statusKind ?? mapInstantConsultStatusKind(status);
  const message = apiResult.message ?? apiResult.Message ?? "";
  const doctorId = apiResult.doctorId ?? apiResult.DoctorId ?? null;
  const hasOffer =
    kind === "matched" || String(status).toUpperCase() === "OFFERED" || doctorId != null;
  return {
    empty: false,
    hasOffer,
    queuePosition: apiResult.queuePosition ?? apiResult.QueuePosition ?? null,
    status,
    statusKind: kind,
    statusLabel:
      apiResult.statusLabel ?? instantConsultStatusLabel(kind, status, message),
    doctorId,
    instantConsultRequestId:
      apiResult.instantConsultRequestId ?? apiResult.InstantConsultRequestId ?? null,
    message,
  };
};

/** PAT-25.02 — request (or refresh) queue & offer from Instant API — no separate poll. */
export const loadInstantQueueOfferScreen = async ({
  patientId,
  contactName,
  contactMobile,
  accessToken,
  existingResult,
} = {}) => {
  assertOnline();
  if (existingResult) {
    return buildInstantQueueOfferView(existingResult);
  }
  const result = await requestInstantConsult({
    patientId,
    contactName,
    contactMobile,
    accessToken,
  });
  return buildInstantQueueOfferView(result);
};

/** PAT-25.02 — doctor lists open instant offers (Bearer treating doctor). */
export const fetchInstantDoctorOffers = async (accessToken) => {
  assertOnline();
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Doctor access token is required to list instant offers.");
  }
  const res = await publicClient.get("/Tele/Instant/Offers", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = unwrap(res);
  const rows = payload.data ?? payload.Data ?? [];
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    doctorOfferId: row.doctorOfferId ?? row.DoctorOfferId,
    instantConsultRequestId:
      row.instantConsultRequestId ?? row.InstantConsultRequestId,
    doctorId: row.doctorId ?? row.DoctorId,
    status: row.status ?? row.Status ?? "OFFERED",
    contactName: row.contactName ?? row.ContactName ?? "",
    queuePosition: row.queuePosition ?? row.QueuePosition ?? null,
  }));
};

/** PAT-25.02 — doctor accepts an OFFERED instant request. */
export const acceptInstantDoctorOffer = async (requestId, accessToken) => {
  assertOnline();
  const id = Number(requestId);
  if (!id) throw new Error("instantConsultRequestId is required.");
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Doctor access token is required to accept an offer.");
  }
  const res = await publicClient.post(
    `/Tele/Instant/${id}/Accept`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const payload = unwrap(res);
  const status = payload.status ?? payload.Status ?? "ACCEPTED";
  return {
    success: Boolean(payload.success ?? payload.Success ?? true),
    instantConsultRequestId:
      payload.instantConsultRequestId ?? payload.InstantConsultRequestId ?? id,
    doctorOfferId: payload.doctorOfferId ?? payload.DoctorOfferId ?? null,
    status,
    statusKind: mapInstantConsultStatusKind(status),
    statusLabel: instantConsultStatusLabel(
      mapInstantConsultStatusKind(status),
      status,
      ""
    ),
  };
};

/**
 * PAT-26.02 — Phase 8–15 device check for Patient Mobile (same URL as web).
 * GET /api/Tele/DeviceCheck — TOKEN = no. Values "client" mean the phone checks
 * camera/mic/speaker/connection itself; this URL does not open them.
 * Do not invent pass/fail or paid/signed state locally from this stub.
 */
export const getTeleDeviceCheck = async () => {
  assertOnline();
  const res = await publicClient.get("/Tele/DeviceCheck");
  const payload = unwrap(res);
  return {
    success: Boolean(payload.success ?? payload.Success ?? true),
    camera: payload.camera ?? payload.Camera ?? "client",
    microphone: payload.microphone ?? payload.Microphone ?? "client",
    speaker: payload.speaker ?? payload.Speaker ?? "client",
    connection: payload.connection ?? payload.Connection ?? "client",
    vendor: payload.vendor ?? payload.Vendor ?? "stub",
  };
};

/** PAT-26.02 — screen model: API stub + optional local permission probes (not paid/signed). */
export const loadDeviceCheckScreen = async ({ probeLocal = true } = {}) => {
  assertOnline();
  const api = await getTeleDeviceCheck();
  const checks = [
    { key: "camera", label: "Camera", apiValue: api.camera },
    { key: "microphone", label: "Microphone", apiValue: api.microphone },
    { key: "speaker", label: "Speaker", apiValue: api.speaker },
    { key: "connection", label: "Connection", apiValue: api.connection },
  ].map((row) => ({
    ...row,
    // API says "client" → device must verify; never treat stub as PAID/passed invent.
    responsibility: String(row.apiValue).toLowerCase() === "client" ? "client" : "server",
    note:
      String(row.apiValue).toLowerCase() === "client"
        ? "Checked on this device (API does not open hardware)."
        : String(row.apiValue),
  }));

  let localProbes = null;
  if (probeLocal && typeof navigator !== "undefined") {
    localProbes = {
      mediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
      onLine: navigator.onLine !== false,
    };
  }

  return {
    api,
    checks,
    vendor: api.vendor,
    localProbes,
    readyHint:
      "Use this device’s camera and microphone permissions before joining tele. Server stub does not grant access.",
  };
};

/**
 * PAT-27.02 — Phase 8–15 waiting room for Patient Mobile (same URL as web).
 * GET /api/Tele/Sessions/{sessionId} — Bearer: owning patient or treating doctor.
 * Poll until status is Active, then call Token (PAT-28). Do not invent Active/Ended locally.
 */
export const WAITING_ROOM_POLL_MS = 5000;

export const mapWaitingRoomStatusKind = (raw) => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "active") return "active";
  if (s === "ended") return "ended";
  if (s === "waiting") return "waiting";
  return "waiting";
};

export const waitingRoomStatusLabel = (kind, raw) => {
  if (kind === "active") return "Doctor joined — ready for call token";
  if (kind === "ended") return "Session ended";
  const s = String(raw ?? "").trim();
  if (!s || s.toLowerCase() === "waiting") return "Waiting for the doctor to join";
  return s;
};

export const getWaitingRoomStatus = async (sessionId, accessToken) => {
  assertOnline();
  const id = Number(sessionId);
  if (!id) throw new Error("sessionId is required.");
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Sign in as the patient (or treating doctor) to open the waiting room.");
  }
  const res = await publicClient.get(`/Tele/Sessions/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = unwrap(res);
  const data = payload.data ?? payload.Data ?? payload;
  const status = data.status ?? data.Status ?? "Waiting";
  const kind = mapWaitingRoomStatusKind(status);
  return {
    teleSessionId: data.teleSessionId ?? data.TeleSessionId ?? id,
    patientAppId: data.patientAppId ?? data.PatientAppId,
    doctorId: data.doctorId ?? data.DoctorId,
    patientId: data.patientId ?? data.PatientId,
    roomId: data.roomId ?? data.RoomId,
    status,
    statusKind: kind,
    statusLabel: waitingRoomStatusLabel(kind, status),
    recordAllowed: Boolean(data.recordAllowed ?? data.RecordAllowed),
    readyForToken: kind === "active",
  };
};

/**
 * PAT-27.02 — poll session status until stop() or options.stopWhenActive.
 * @returns {() => void} stop
 */
export const startWaitingRoomPoll = (sessionId, accessToken, onTick, options = {}) => {
  const intervalMs = options.intervalMs > 0 ? options.intervalMs : WAITING_ROOM_POLL_MS;
  const stopWhenActive = options.stopWhenActive !== false;
  let stopped = false;
  let timer = null;

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(run, intervalMs);
  };

  const run = async () => {
    if (stopped) return;
    try {
      const row = await getWaitingRoomStatus(sessionId, accessToken);
      if (!stopped) onTick?.(row, null);
      if (stopWhenActive && row?.readyForToken) {
        stopped = true;
        return;
      }
    } catch (err) {
      if (!stopped) onTick?.(null, err);
    }
    schedule();
  };

  run();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
};

/**
 * PAT-29.02 — Phase 8–15 recording consent for Patient Mobile (same URL as web).
 * POST /api/Tele/Consent — Bearer (patient or doctor on the session).
 * recordAllowed becomes true only after both doctor and patient send accepted:true.
 * Decline still audits; never invent recordAllowed / signed locally.
 */
export const postTeleRecordingConsent = async ({
  teleSessionId,
  accepted,
  accessToken,
} = {}) => {
  assertOnline();
  const id = Number(teleSessionId);
  if (!id) throw new Error("teleSessionId is required.");
  if (typeof accepted !== "boolean") {
    throw new Error("accepted must be true or false.");
  }
  if (!accessToken || !String(accessToken).trim()) {
    throw new Error("Sign in as the patient (or treating doctor) to record consent.");
  }
  const res = await publicClient.post(
    "/Tele/Consent",
    { teleSessionId: id, accepted },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const payload = unwrap(res);
  const recordAllowed = Boolean(payload.recordAllowed ?? payload.RecordAllowed);
  const acceptedOut = Boolean(payload.accepted ?? payload.Accepted ?? accepted);
  return {
    success: Boolean(payload.success ?? payload.Success ?? true),
    teleSessionId: payload.teleSessionId ?? payload.TeleSessionId ?? id,
    accepted: acceptedOut,
    byRole: payload.byRole ?? payload.ByRole ?? null,
    recordAllowed,
    recordAllowedLabel: recordAllowed
      ? "Recording allowed (both sides accepted)"
      : acceptedOut
        ? "Your consent was recorded — waiting for the other party"
        : "Consent declined — recording not allowed",
  };
};

/** PAT-29.02 — screen helper: submit consent and map API fields only. */
export const loadRecordingConsentScreen = async ({
  teleSessionId,
  accepted,
  accessToken,
} = {}) => {
  assertOnline();
  if (teleSessionId == null || teleSessionId === "") {
    return {
      empty: true,
      result: null,
      needsAuth: !accessToken,
    };
  }
  if (typeof accepted !== "boolean") {
    return {
      empty: false,
      pendingChoice: true,
      teleSessionId: Number(teleSessionId),
      needsAuth: !accessToken,
      result: null,
    };
  }
  const result = await postTeleRecordingConsent({
    teleSessionId,
    accepted,
    accessToken,
  });
  return {
    empty: false,
    pendingChoice: false,
    teleSessionId: result.teleSessionId,
    needsAuth: false,
    result,
  };
};

export const listPublicArticles = async (params = {}) => {
  const res = await publicClient.get("/Public/Articles", { params });
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? [];
};

export const getPublicArticle = async (id) => {
  const res = await publicClient.get(`/Public/Articles/${id}`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};

export const listCareCategories = async () => {
  const res = await publicClient.get("/PatientPortal/CareCategories");
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? [];
};

/** WEB-11.03 — join waitlist when the selected day has no open slots. Does not reserve a slot. */
export const joinWaitlist = async ({ doctorId, requestedDate, consultMode, contactName, contactMobile, patientId }) => {
  const res = await publicClient.post("/Waitlist/Join", {
    doctorId: Number(doctorId),
    patientId: patientId ? Number(patientId) : null,
    requestedDate,
    consultMode,
    contactName,
    contactMobile,
  });
  return unwrap(res);
};

/** SUP-06 — published help centre articles. */
export const listPublicHelp = async () => {
  const res = await publicClient.get("/Help");
  const payload = unwrap(res);
  const data = payload.data ?? payload.Data ?? payload;
  return Array.isArray(data) ? data : [];
};

export const getPublicHelpArticle = async (slug) => {
  const res = await publicClient.get(`/Help/${encodeURIComponent(slug)}`);
  const payload = unwrap(res);
  return payload.data ?? payload.Data ?? payload;
};
