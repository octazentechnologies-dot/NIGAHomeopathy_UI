/** Checklist #40 / S4 demo #6 — badge text follows API PaymentStatus. */
export const paymentStatusMeta = (rawStatus) => {
  const raw = String(rawStatus || "UNPAID").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (raw === "PAID") return { label: "Paid", tone: "success" };
  if (raw === "FAILED") return { label: "Failed", tone: "danger" };
  if (raw === "REFUNDED") return { label: "Refunded", tone: "secondary" };
  if (raw === "PAY_AT_CLINIC" || raw === "PAYATCLINIC" || raw === "PENDING") {
    return { label: "Pay-at-clinic", tone: "warning" };
  }
  if (raw === "UNPAID" || !raw) return { label: "Unpaid", tone: "danger" };
  return { label: String(rawStatus || "Unpaid"), tone: "warning" };
};

export const isOpenPaymentStatus = (rawStatus) => {
  const label = paymentStatusMeta(rawStatus).label;
  return label !== "Paid" && label !== "Refunded";
};
