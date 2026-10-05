/**
 * TRU-06 — visitor review moderation queue.
 * Visitors submit reviews from the public doctor profile; they stay Pending until an admin
 * approves them, and only Approved reviews are shown on that doctor's profile.
 * Kept in localStorage until the backend exposes moderation endpoints.
 */

const STORAGE_KEY = "niga.reviewModeration.v1";
export const REVIEWS_CHANGED_EVENT = "niga-reviews-changed";

export const REVIEW_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const daysAgo = (days, hours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const SEED_REVIEWS = [
  { name: "Amit Sharma", doctorName: "Dr. Rohit Mehta", rating: 4, mode: "In-Clinic", text: "Very good experience. Explained everything clearly.", status: REVIEW_STATUS.PENDING, at: daysAgo(0, 3) },
  { name: "Pooja Kulkarni", doctorName: "Dr. Sneha Patil", rating: 5, mode: "Tele Consultation", text: "Video call started on time and the doctor listened patiently. Prescription came right after the call.", status: REVIEW_STATUS.PENDING, at: daysAgo(0, 9) },
  { name: "Rahul Verma", doctorName: "Dr. Rohit Mehta", rating: 3, mode: "In-Clinic", text: "Treatment is helping but the waiting time at the clinic was more than 40 minutes.", status: REVIEW_STATUS.PENDING, at: daysAgo(1) },
  { name: "Neha Joshi", doctorName: "Dr. Amit Shah", rating: 5, mode: "In-Clinic", text: "My son's recurring cold has reduced a lot. Very gentle with kids.", status: REVIEW_STATUS.PENDING, at: daysAgo(2) },
  { name: "Vikas More", doctorName: "Dr. Sneha Patil", rating: 2, mode: "Tele Consultation", text: "Call dropped twice. Doctor was good but the experience was not smooth.", status: REVIEW_STATUS.PENDING, at: daysAgo(3) },
  { name: "Priya Nair", doctorName: "Dr. Rohit Mehta", rating: 5, mode: "Tele Consultation", text: "Clear advice on diet and remedy. Skin allergy much better in 3 weeks.", status: REVIEW_STATUS.APPROVED, at: daysAgo(6) },
  { name: "Sneha Patil", doctorName: "Dr. Amit Shah", rating: 4, mode: "In-Clinic", text: "Clean clinic and helpful staff.", status: REVIEW_STATUS.APPROVED, at: daysAgo(9) },
  { name: "Kiran Joshi", doctorName: "Dr. Sneha Patil", rating: 5, mode: "In-Clinic", text: "Follow-up was on time and the doctor remembered my history.", status: REVIEW_STATUS.APPROVED, at: daysAgo(14) },
  { name: "Meera Iyer", doctorName: "Dr. Rohit Mehta", rating: 4, mode: "In-Clinic", text: "Good listener, explained the remedy and dosage clearly.", status: REVIEW_STATUS.APPROVED, at: daysAgo(21) },
  { name: "Unknown visitor", doctorName: "Dr. Amit Shah", rating: 1, mode: "In-Clinic", text: "Call me on 98XXXXXXX for cheap medicines!!!", status: REVIEW_STATUS.REJECTED, at: daysAgo(5), note: "Spam / promotional content" },
  { name: "Anonymous", doctorName: "Dr. Sneha Patil", rating: 1, mode: "Tele Consultation", text: "Never consulted, just checking.", status: REVIEW_STATUS.REJECTED, at: daysAgo(12), note: "Not a genuine consultation" },
].map((row, index) => ({ ...row, id: `seed-${index + 1}`, doctorId: null, sample: true }));

const read = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {
    // fall through to seed data
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
  return [...SEED_REVIEWS];
};

const write = (list) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
};

export const listModerationReviews = () =>
  read().sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

export const submitVisitorReview = ({ doctorId, doctorName, name, rating, mode, text }) => {
  const review = {
    id: `rv-${Date.now()}`,
    doctorId: doctorId != null ? String(doctorId) : null,
    doctorName: doctorName || "",
    name: String(name || "").trim() || "Visitor",
    rating: Number(rating) || 0,
    mode: mode || "",
    text: String(text || "").trim(),
    status: REVIEW_STATUS.PENDING,
    at: new Date().toISOString(),
  };
  write([review, ...read()]);
  return review;
};

export const setReviewStatus = (id, status, note = "") => {
  const list = read().map((row) =>
    row.id === id ? { ...row, status, note: note || row.note || "", decidedAt: new Date().toISOString() } : row
  );
  write(list);
  return list;
};

export const listApprovedReviewsForDoctor = (doctorId) => {
  if (doctorId == null) return [];
  return listModerationReviews().filter(
    (row) => row.status === REVIEW_STATUS.APPROVED && String(row.doctorId) === String(doctorId)
  );
};
