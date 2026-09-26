import moment from "moment";

const DEMO_DOCTORS = [
  { value: "doc-1", label: "Dr. Priya Sharma" },
  { value: "doc-2", label: "Dr. Rahul Mehta" },
  { value: "doc-3", label: "Dr. Anjali Kulkarni" },
];

const parseMoney = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const digits = String(value).replace(/[^\d.]/g, "");
  return Number(digits) || 0;
};

const parseBp = (value) => {
  const match = String(value || "").match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { bloodPressureSystolic: "", bloodPressureDiastolic: "" };
  return {
    bloodPressureSystolic: match[1],
    bloodPressureDiastolic: match[2],
  };
};

const parseNumericPart = (value) => {
  const match = String(value || "").match(/[\d.]+/);
  return match ? match[0] : "";
};

const parseDuration = (duration) => {
  const text = String(duration || "").trim();
  const match = text.match(/^(\d+)\s*(days?|weeks?|months?)?$/i);
  if (!match) {
    return { durationValue: "", durationUnit: "days" };
  }
  const unitRaw = (match[2] || "days").toLowerCase();
  let durationUnit = "days";
  if (unitRaw.startsWith("week")) durationUnit = "weeks";
  else if (unitRaw.startsWith("month")) durationUnit = "months";
  return { durationValue: match[1], durationUnit };
};

const severityToValue = (severity) => {
  const text = String(severity || "").toLowerCase();
  if (text.includes("mild")) return "mild";
  if (text.includes("severe")) return "severe";
  return "moderate";
};

const findDoctor = (doctorLabel) =>
  DEMO_DOCTORS.find((doctor) => doctor.label === doctorLabel) || {
    value: "doc-custom",
    label: doctorLabel || "Doctor",
  };

/**
 * Map an appointments-table row into Quick Action check-in state for editing.
 */
export const mapAppointmentRowToCheckIn = (row) => {
  if (!row) return null;

  const patientDetails = row.patientDetails || {};
  const vitalsSource = row.vitals || {};
  const paymentSource = row.paymentDetails || {};
  const doctor = findDoctor(row.doctor);
  const slotLabel = row.time || "—";
  const dateDisplay = row.dateDisplay || moment().format("DD MMM YYYY");
  const bp = parseBp(vitalsSource.bloodPressure);
  const durationParts = parseDuration(row.duration);
  const severity = severityToValue(row.severity);
  const amount = parseMoney(paymentSource.amount || paymentSource.total || row.payment);
  const paymentStatus = row.status === "Paid" ? "Paid" : "Unpaid";

  const selectedPatient = {
    id: patientDetails.patientId || row.id,
    fullName: patientDetails.fullName || row.patient,
    age: (patientDetails.ageSex || "").split("/")[0]?.trim() || "—",
    sex: (patientDetails.ageSex || "").split("/")[1]?.trim() || "—",
    mobileNo: patientDetails.mobile || "—",
    address: patientDetails.address || patientDetails.place || "—",
    email: patientDetails.email || "",
  };

  const allottedSchedule = {
    doctor,
    date: moment().format("YYYY-MM-DD"),
    dateDisplay,
    slot: {
      label: slotLabel,
      time: slotLabel,
      status: "available",
    },
  };

  const appointmentDetails = {
    patient: selectedPatient,
    schedule: allottedSchedule,
    chiefComplaints: row.chiefComplaints || "",
    duration: row.duration || "",
    durationValue: durationParts.durationValue,
    durationUnit: durationParts.durationUnit,
    severity,
    severityLabel: row.severity || "Moderate",
  };

  const vitalsDetails = {
    ...bp,
    bloodPressure: vitalsSource.bloodPressure
      ? String(vitalsSource.bloodPressure).replace(/\s*mmHg/i, "").trim()
      : bp.bloodPressureSystolic && bp.bloodPressureDiastolic
        ? `${bp.bloodPressureSystolic}/${bp.bloodPressureDiastolic}`
        : "",
    pulse: parseNumericPart(vitalsSource.pulse),
    temperature: parseNumericPart(vitalsSource.temperature),
    weight: parseNumericPart(vitalsSource.weight),
    height: parseNumericPart(vitalsSource.height),
    spo2: parseNumericPart(vitalsSource.spo2),
    respiratoryRate: parseNumericPart(vitalsSource.respiratoryRate),
    bloodSugar: parseNumericPart(vitalsSource.bloodSugar),
    notes: vitalsSource.notes || "",
  };

  const paymentDetails = {
    patient: selectedPatient,
    schedule: allottedSchedule,
    paymentMethod: paymentSource.method && paymentSource.method !== "—" ? paymentSource.method : "UPI",
    amount,
    gst: parseMoney(paymentSource.gst),
    total: parseMoney(paymentSource.total || row.payment) || amount,
    paymentStatus,
    notes: paymentSource.notes || "",
  };

  const completedActionIds = [
    "patient-details",
    "doctor-schedule",
    "new-appointment",
  ];
  if (vitalsDetails.bloodPressure || vitalsDetails.pulse) {
    completedActionIds.push("collect-vitals");
  }
  if (paymentStatus === "Paid") {
    if (!completedActionIds.includes("collect-vitals")) {
      completedActionIds.push("collect-vitals");
    }
    completedActionIds.push("collect-payment");
    completedActionIds.push("case-paper");
  } else if (row.appointmentStatus === "Waiting" || vitalsDetails.bloodPressure) {
    if (!completedActionIds.includes("collect-vitals")) {
      completedActionIds.push("collect-vitals");
    }
  }

  let preferredStep = "new-appointment";
  if (paymentStatus === "Unpaid") preferredStep = "collect-payment";
  else if (row.appointmentStatus === "Waiting") preferredStep = "collect-vitals";
  else if (paymentStatus === "Paid") preferredStep = "case-paper";

  return {
    selectedPatient,
    allottedSchedule,
    appointmentDetails,
    vitalsDetails,
    paymentDetails,
    completedActionIds,
    preferredStep,
    consultationFee: amount || 800,
  };
};
