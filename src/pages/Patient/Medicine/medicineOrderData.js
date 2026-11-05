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

/** Allows 0 (known free delivery). Null/undefined → "—". */
export const formatMoneyOrDash = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
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
  const quoteAmount = pick(row, "quoteAmount", "QuoteAmount");
  const deliveryFee = pick(row, "deliveryFee", "DeliveryFee");
  const totalPaid = pick(row, "totalPaid", "TotalPaid");
  const licence = pick(row, "pharmacyLicenceNumber", "PharmacyLicenceNumber");
  return {
    id,
    orderNo: `HM${String(id).padStart(6, "0")}`,
    date: pick(row, "createdAt", "CreatedAt"),
    deliveredAt: pick(row, "deliveredAt", "DeliveredAt"),
    pharmacy: pharmacyName ? [pharmacyName, pharmacyArea].filter(Boolean).join(", ") : "Pharmacy",
    pharmacyName: pharmacyName || "",
    pharmacyArea: pharmacyArea || "",
    pharmacyLicenceNumber: licence || "",
    pharmacyLicensed: Boolean(pick(row, "pharmacyLicensed", "PharmacyLicensed")),
    pharmacyContactMasked: pick(row, "pharmacyContactMasked", "PharmacyContactMasked") || "",
    erxId: pick(row, "erxSnapshotId", "ErxSnapshotId"),
    rxLabel: pick(row, "rxLabel", "RxLabel") || "",
    doctorName: pick(row, "doctorName", "DoctorName") || "",
    items: Array.isArray(items) ? items.map(normalizeItem) : [],
    amount: Number(quoteAmount || 0),
    quoteAmount: quoteAmount == null ? null : Number(quoteAmount),
    deliveryFee: deliveryFee == null ? null : Number(deliveryFee),
    subtotalMedicines: (() => {
      const s = pick(row, "subtotalMedicines", "SubtotalMedicines");
      return s == null ? null : Number(s);
    })(),
    totalPaid: totalPaid == null ? null : Number(totalPaid),
    currency: pick(row, "currency", "Currency") || "INR",
    quoteNote: pick(row, "quoteNote", "QuoteNote") || "",
    payMode: pick(row, "payMode", "PayMode") || "",
    paymentOrderId: pick(row, "paymentOrderId", "PaymentOrderId"),
    invoiceId: pick(row, "invoiceId", "InvoiceId"),
    invoiceNumber: pick(row, "invoiceNumber", "InvoiceNumber") || "",
    invoicePdfAvailable: Boolean(pick(row, "invoicePdfAvailable", "InvoicePdfAvailable")),
    status: String(pick(row, "status", "Status") || "OFFERED"),
    events: Array.isArray(events) ? events.map(normalizeEvent) : [],
    review: normalizeReview(pick(row, "review", "Review")),
  };
};

export const normalizePharmacy = (row) => {
  const areasRaw = pick(row, "areas", "Areas");
  const areas = Array.isArray(areasRaw)
    ? areasRaw.map((a) => String(a || "").trim()).filter(Boolean)
    : [];
  const daysRaw = pick(row, "workingDays", "WorkingDays");
  const workingDays = Array.isArray(daysRaw)
    ? daysRaw.map((d) => String(d || "").trim()).filter(Boolean)
    : [];
  const openNow = pick(row, "openNow", "OpenNow");
  const serviceable = pick(row, "serviceable", "Serviceable");
  const deliveryFee = pick(row, "deliveryFee", "DeliveryFee");
  const freeAbove = pick(row, "freeDeliveryAbove", "FreeDeliveryAbove", "freeAbove", "FreeAbove");
  return {
    id: pick(row, "pharmacyPartnerId", "PharmacyPartnerId", "id", "Id"),
    name: pick(row, "name", "Name", "pharmacyName", "PharmacyName") || "Pharmacy",
    area: pick(row, "area", "Area", "city", "City") || areas[0] || "",
    areas,
    openTime: pick(row, "openTime", "OpenTime") || "",
    closeTime: pick(row, "closeTime", "CloseTime") || "",
    workingDays,
    openNow: openNow == null ? null : Boolean(openNow),
    serviceable: serviceable == null ? null : Boolean(serviceable),
    closedReason: pick(row, "closedReason", "ClosedReason") || "",
    deliveryFee: deliveryFee == null || deliveryFee === "" ? null : Number(deliveryFee),
    freeDeliveryAbove: freeAbove == null || freeAbove === "" ? null : Number(freeAbove),
    configured: Boolean(pick(row, "configured", "Configured")),
  };
};

export const formatPharmacyHours = (row) => {
  if (!row?.openTime || !row?.closeTime) return "";
  return `${row.openTime} – ${row.closeTime}`;
};

export const formatPharmacyDeliveryFee = (row) => {
  if (row?.deliveryFee == null || Number.isNaN(row.deliveryFee)) return "";
  if (Number(row.deliveryFee) === 0) return "Free delivery";
  const fee = `₹${Number(row.deliveryFee).toLocaleString("en-IN")}`;
  if (row.freeDeliveryAbove != null && !Number.isNaN(row.freeDeliveryAbove) && row.freeDeliveryAbove > 0) {
    return `${fee} delivery · free above ₹${Number(row.freeDeliveryAbove).toLocaleString("en-IN")}`;
  }
  return `${fee} delivery`;
};
