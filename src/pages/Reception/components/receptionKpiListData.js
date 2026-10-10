import moment from "moment";
import { paymentStatusMeta } from "../../../helpers/paymentStatusBadge";

export const APPOINTMENT_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "doctor", label: "Doctor", tdClassName: "text-nowrap" },
  { key: "time", label: "Time", type: "strong", tdClassName: "text-nowrap" },
  { key: "type", label: "Type", className: "text-muted" },
  { key: "status", label: "Status", type: "badge" },
];

export const PENDING_PAYMENT_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "doctor", label: "Doctor", tdClassName: "text-nowrap" },
  { key: "time", label: "Time", type: "strong", tdClassName: "text-nowrap" },
  { key: "method", label: "Method" },
  { key: "payment", label: "Payment", type: "badge" },
];

export const TOTAL_PATIENT_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "visits", label: "Visits Today" },
  { key: "time", label: "First Slot", tdClassName: "text-nowrap" },
  { key: "status", label: "Status", type: "badge" },
];

const genderShort = (gender) => {
  if (gender === 0 || gender === "0" || gender === "M") return "M";
  if (gender === 1 || gender === "1" || gender === "F") return "F";
  return "";
};

const titleCase = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Maps one row of the reception queue API into the KPI list shape. */
export const mapQueueKpiRow = (row) => {
  const age = row.age ?? row.Age;
  const sex = genderShort(row.gender ?? row.Gender);
  const time = row.appointmentTime ?? row.AppointmentTime;
  const parsedTime = time ? moment(time, ["HH:mm:ss", "HH:mm", moment.ISO_8601]) : null;
  const mode = String(row.consultMode || row.ConsultMode || "").toUpperCase();
  const tele = row.isTele ?? row.IsTele;
  const pay = paymentStatusMeta(row.paymentStatus ?? row.PaymentStatus);
  return {
    id: row.patientAppId ?? row.PatientAppId,
    patientId: row.patientId ?? row.PatientId,
    patient: row.patientName ?? row.PatientName ?? "Patient",
    ageSex: [age != null ? `${age}y` : "", sex].filter(Boolean).join(" / ") || "—",
    mobile: row.mobileNo || row.MobileNo || "—",
    doctor: row.doctorName || row.DoctorName || "—",
    time: parsedTime && parsedTime.isValid() ? parsedTime.format("hh:mm A") : "—",
    sortTime: parsedTime && parsedTime.isValid() ? parsedTime.valueOf() : Number.MAX_SAFE_INTEGER,
    type: tele === true || mode.includes("TELE") ? "Teleconsult" : "In-Clinic",
    status: titleCase(row.status || row.Status || "—"),
    rawStatus: String(row.status || row.Status || "").toUpperCase(),
    payment: pay.label,
    paid: pay.label === "Paid",
    method: row.paymentMethod || row.PaymentMethod || "—",
  };
};

const uniquePatients = (rows) => {
  const byPatient = new Map();
  rows.forEach((r) => {
    const key = r.patientId || `app-${r.id}`;
    const current = byPatient.get(key);
    if (!current) byPatient.set(key, { ...r, visits: 1 });
    else {
      current.visits += 1;
      if (r.sortTime < current.sortTime) {
        current.time = r.time;
        current.sortTime = r.sortTime;
      }
    }
  });
  return [...byPatient.values()];
};

export const RECEPTION_KPI_MODALS = {
  "today-appointments": {
    title: "Today's Appointments",
    icon: "ri-calendar-check-line",
    searchPlaceholder: "Search patient, mobile, doctor...",
    entityLabel: "Patients",
    emptyMessage: "No appointments today",
    columns: APPOINTMENT_COLUMNS,
    select: (rows) => rows,
  },
  "waiting-patients": {
    title: "Waiting Patients",
    icon: "ri-hourglass-line",
    searchPlaceholder: "Search patient, mobile, doctor...",
    entityLabel: "Waiting Patients",
    emptyMessage: "No waiting patients",
    columns: APPOINTMENT_COLUMNS,
    select: (rows) => rows.filter((r) => r.rawStatus === "WAITING"),
  },
  "pending-payments": {
    title: "Pending Payments",
    icon: "ri-wallet-3-line",
    searchPlaceholder: "Search patient, mobile, doctor...",
    entityLabel: "Pending Payments",
    emptyMessage: "No pending payments",
    columns: PENDING_PAYMENT_COLUMNS,
    select: (rows) => rows.filter((r) => !r.paid && r.rawStatus !== "CANCELLED"),
  },
  "today-patients": {
    title: "Total Patients",
    icon: "ri-team-line",
    searchPlaceholder: "Search patient, mobile...",
    entityLabel: "Patients",
    emptyMessage: "No patients today",
    columns: TOTAL_PATIENT_COLUMNS,
    select: uniquePatients,
  },
};
