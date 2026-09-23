import axios from "axios";
import { api } from "../config";
import Avatar1 from "../assets/images/users/avatar-1.jpg";

/** Anonymous New-API client for public find-doctor / booking / policies / articles. */
const publicClient = axios.create({
  baseURL: api.API_URL_NIGAHOMEOPATHY,
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
    rating: Number(fallback.rating || 4.8),
    reviews: Number(fallback.reviews || 0),
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
    rankingReasons: row?.rankingReasons ?? row?.RankingReasons ?? [],
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
