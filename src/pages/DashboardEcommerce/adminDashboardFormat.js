import moment from "moment";

/** ₹ amount; compact (K / L / Cr) unless full is set. */
export const formatRupees = (value, full = false) => {
  const amount = Number(value) || 0;
  if (full || Math.abs(amount) < 1000) {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
  if (Math.abs(amount) >= 1e7) return `₹${(amount / 1e7).toFixed(2)}Cr`;
  if (Math.abs(amount) >= 1e5) return `₹${(amount / 1e5).toFixed(2)}L`;
  return `₹${(amount / 1e3).toFixed(1)}K`;
};

/** Percent change vs the previous period; null when there is nothing to compare. */
export const percentChange = (current, previous) => {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 1000) / 10;
};

export const formatDay = (value, format = "DD MMM YYYY") => (value ? moment(value).format(format) : "—");

const STATUS_TONE = {
  COMPLETED: "success",
  CANCELLED: "danger",
  WAITING: "warning",
  "WALK-IN": "info",
  "E-CONSULT": "primary",
  "NOT ARRIVED": "secondary",
  REMAINING: "secondary",
};

export const appointmentStatusTone = (status) => STATUS_TONE[String(status || "").toUpperCase()] || "secondary";

export const consultModeLabel = (row) => {
  const mode = String(row?.consultMode || "").toLowerCase();
  if (row?.isTele || mode.includes("tele") || mode.includes("video") || String(row?.status || "").toUpperCase() === "E-CONSULT") {
    return "Video consult";
  }
  return "In-clinic";
};

export const paymentLabel = (status) => {
  const raw = String(status || "").toUpperCase();
  if (raw === "PAID" || raw === "COLLECTED" || raw === "CAPTURED") return "Paid";
  if (raw === "REFUNDED") return "Refunded";
  if (raw === "WAIVED") return "Waived";
  return raw ? "Unpaid" : "—";
};

export const downloadCsv = (fileName, rows) => {
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
