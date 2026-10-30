/** Checklist #40 / S4 demo #6 — badge text follows API PaymentStatus (+ pay-at-clinic flags). */
export const paymentStatusMeta = (rawStatus, options = {}) => {
  const raw = String(rawStatus || "UNPAID").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const method = String(options.paymentMethod || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const payAtClinic =
    options.payAtClinicAllowed === true ||
    method === "PAY_AT_CLINIC" ||
    method === "PAYATCLINIC";

  if (raw === "PAID") return { label: "Paid", tone: "success" };
  if (raw === "FAILED") return { label: "Failed", tone: "danger" };
  if (raw === "REFUNDED") return { label: "Refunded", tone: "secondary" };
  if (raw === "PAY_AT_CLINIC" || raw === "PAYATCLINIC") {
    return { label: "Pay-at-clinic", tone: "warning" };
  }
  // Online hold stays Pending until capture → PAID. Pay-at-clinic holds use flags / method.
  if (raw === "PENDING") {
    if (payAtClinic) return { label: "Pay-at-clinic", tone: "warning" };
    return { label: "Pending", tone: "warning" };
  }
  if (raw === "UNPAID" || !raw) {
    if (payAtClinic) return { label: "Pay-at-clinic", tone: "warning" };
    return { label: "Unpaid", tone: "danger" };
  }
  return { label: String(rawStatus || "Unpaid"), tone: "warning" };
};

export const isOpenPaymentStatus = (rawStatus, options = {}) => {
  const label = paymentStatusMeta(rawStatus, options).label;
  return label !== "Paid" && label !== "Refunded";
};
