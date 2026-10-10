import moment from "moment";

export const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

export const formatINR = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const formatDate = (value, format = "DD MMM YYYY") => (value ? moment(value).format(format) : "—");

export const TRACKING_STEPS = [
  { id: "placed", label: "Order Placed", icon: "ri-shopping-bag-3-line" },
  { id: "process", label: "In Process", icon: "ri-loader-4-line" },
  { id: "out", label: "Out for Delivery", icon: "ri-truck-line" },
  { id: "delivered", label: "Delivered", icon: "ri-checkbox-circle-line" },
];

/** Maps raw MedicineOrder statuses to the patient-facing stage, label and next action. */
export const orderStage = (rawStatus) => {
  const status = String(rawStatus || "").toUpperCase();
  if (/CANCEL|REJECT/.test(status)) {
    return { key: "cancelled", label: "Cancelled", tone: "danger", step: -1 };
  }
  if (/DELIVER|COMPLETE/.test(status)) {
    return { key: "delivered", label: "Delivered", tone: "success", step: 3 };
  }
  if (/DISPATCH|OUT_FOR/.test(status)) {
    return { key: "out", label: "Out for Delivery", tone: "info", step: 2 };
  }
  if (status === "QUOTED_ACCEPTED") {
    return { key: "payment", label: "Awaiting payment", tone: "warning", step: 0, action: "pay" };
  }
  if (status === "QUOTED") {
    return { key: "quoted", label: "Quote received", tone: "primary", step: 0, action: "accept" };
  }
  if (/PAID|COD|CONFIRM|PROCESS|READY|PACK/.test(status)) {
    return { key: "process", label: "In Process", tone: "info", step: 1 };
  }
  return { key: "placed", label: "Awaiting quote", tone: "muted", step: 0 };
};

export const isOrderOpen = (order) => !["delivered", "cancelled"].includes(orderStage(order.status).key);

const STEP_EVENT_STATUSES = {
  process: /PAID|COD|READY/,
  out: /DISPATCH/,
  delivered: /DELIVER/,
};

/** Time the order reached a tracking step, from MedicineOrderEvent rows. */
export const trackingStepTime = (order, stepId) => {
  if (stepId === "placed") return order?.date || null;
  const pattern = STEP_EVENT_STATUSES[stepId];
  if (!pattern) return null;
  const event = (order?.events || []).find((row) => pattern.test(String(row.status || "").toUpperCase()));
  return event?.at || null;
};

const normalizeItem = (row) => ({
  name: pick(row, "remedyName", "RemedyName", "remedyCode", "RemedyCode") || "Medicine",
  code: pick(row, "remedyCode", "RemedyCode") || "",
  potency: pick(row, "potencyCode", "PotencyCode", "potency", "Potency") || "",
  qty: Number(pick(row, "qty", "Qty", "quantity", "Quantity") || 1),
  price: Number(pick(row, "price", "Price") || 0),
});

const normalizeEvent = (row) => ({
  status: pick(row, "status", "Status") || "",
  detail: pick(row, "detail", "Detail") || "",
  at: pick(row, "at", "At"),
});

const normalizeReview = (row) =>
  row
    ? {
        rating: Number(pick(row, "rating", "Rating") || 0),
        comment: pick(row, "comment", "Comment") || "",
        createdAt: pick(row, "createdAt", "CreatedAt"),
      }
    : null;

export const normalizeOrder = (row) => {
  const id = pick(row, "medicineOrderId", "MedicineOrderId");
  const items = pick(row, "items", "Items") || [];
  const events = pick(row, "events", "Events") || [];
  const pharmacyName = pick(row, "pharmacyName", "PharmacyName");
  const pharmacyArea = pick(row, "pharmacyArea", "PharmacyArea");
  return {
    id,
    orderNo: `HM${String(id).padStart(6, "0")}`,
    date: pick(row, "createdAt", "CreatedAt"),
    pharmacy: pharmacyName ? [pharmacyName, pharmacyArea].filter(Boolean).join(", ") : "Auto-routed pharmacy",
    erxId: pick(row, "erxSnapshotId", "ErxSnapshotId"),
    doctorName: pick(row, "doctorName", "DoctorName") || "",
    items: Array.isArray(items) ? items.map(normalizeItem) : [],
    amount: Number(pick(row, "quoteAmount", "QuoteAmount") || 0),
    quoteNote: pick(row, "quoteNote", "QuoteNote") || "",
    payMode: pick(row, "payMode", "PayMode") || "",
    status: String(pick(row, "status", "Status") || "OFFERED"),
    events: Array.isArray(events) ? events.map(normalizeEvent) : [],
    review: normalizeReview(pick(row, "review", "Review")),
  };
};

export const normalizePharmacy = (row) => ({
  id: pick(row, "pharmacyPartnerId", "PharmacyPartnerId", "id", "Id"),
  name: pick(row, "name", "Name", "pharmacyName", "PharmacyName") || "Pharmacy",
  area: pick(row, "area", "Area", "city", "City") || "",
});
