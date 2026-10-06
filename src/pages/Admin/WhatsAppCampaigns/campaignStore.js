import moment from "moment";

export const CAMPAIGN_STATUS = {
  QUEUED: "queued",
  COMPLETED: "completed",
  FAILED: "failed",
};

export const STATUS_LABELS = {
  queued: "In progress",
  completed: "Completed",
  failed: "Failed",
};

export const CATEGORIES = [
  { id: "HospitalService", label: "Hospital service" },
  { id: "OffersDiscount", label: "Offer / discount" },
  { id: "HealthTips", label: "Health tip" },
];

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const statusFrom = (sent, failed) => {
  if (!sent) return CAMPAIGN_STATUS.QUEUED;
  if (failed >= sent) return CAMPAIGN_STATUS.FAILED;
  return CAMPAIGN_STATUS.COMPLETED;
};

/** Maps a /WhatsApp/GetCampaignHistory row to the campaign shape used by the page. */
export const normalizeApiCampaign = (row, doctorNameById = {}) => {
  const apiId = pick(row, "campaignID", "CampaignID", "campaignId", "CampaignId");
  const sent = toNumber(pick(row, "totalMessages", "TotalMessages"));
  const delivered = toNumber(pick(row, "totalDelivered", "TotalDelivered"));
  const failed = toNumber(pick(row, "totalFailed", "TotalFailed"));
  const doctorId = pick(row, "doctorID", "DoctorID", "doctorId", "DoctorId");
  return {
    id: `api-${apiId}`,
    apiId,
    name: pick(row, "campaignName", "CampaignName") || `Campaign #${apiId}`,
    category: pick(row, "campaignCategory", "CampaignCategory") || "",
    doctorId,
    doctorName: doctorNameById[doctorId] || (doctorId ? `Doctor #${doctorId}` : "—"),
    isBulk: Boolean(pick(row, "isBulk", "IsBulk")),
    sent,
    delivered,
    failed,
    status: statusFrom(sent, failed),
    createdAt: pick(row, "enteredDate", "EnteredDate"),
  };
};

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || String(id || "—");

export const pct = (part, whole, digits = 0) => {
  if (!whole) return "0%";
  const value = (part / whole) * 100;
  return `${value.toFixed(value < 10 && digits === 0 ? 1 : digits)}%`;
};

export const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

export const formatDateTime = (value) => {
  const m = value ? moment(value) : null;
  return m && m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : "—";
};

export const campaignInitials = (name) =>
  String(name || "?")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";
