import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import { collectAtReception, createInvoiceByPayment, getInvoiceByPayment, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "UPI", value: "UPI_OFFLINE" },
  { label: "Card", value: "CARD_POS" },
  { label: "Pay link", value: "PAY_LINK" },
];
const DEFAULT_FEE = 800;

const formatRupee = (amount) =>
  `₹ ${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;

const CollectPaymentModal = ({
  isOpen,
  toggle,
  selectedPatient,
  allottedSchedule,
  consultationFee = DEFAULT_FEE,
  initialPayment = null,
  editMode = false,
  onPaymentConfirmed,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("UPI_OFFLINE");
  const [amount, setAmount] = useState(String(DEFAULT_FEE));
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setPaymentMethod(initialPayment?.paymentMethod || "UPI_OFFLINE");
    setAmount(String(initialPayment?.amount ?? consultationFee ?? DEFAULT_FEE));
    setPaymentStatus(initialPayment?.paymentStatus || "Paid");
    setNotes(initialPayment?.notes || "");
    setError("");
    setReceipt(null);
  }, [isOpen, consultationFee, initialPayment]);

  const gst = initialPayment?.gst ?? 0;
  const total = useMemo(() => Number(amount) || 0, [amount]);

  const appointmentLabel = allottedSchedule
    ? `${allottedSchedule.dateDisplay || "—"}, ${allottedSchedule.slot?.label || "—"}`
    : "—";

  const resetAndClose = () => {
    toggle();
  };

  const handleConfirm = async () => {
    const patientAppId = Number(
      selectedPatient?.patientAppId ||
        selectedPatient?.PatientAppId ||
        allottedSchedule?.patientAppId ||
        allottedSchedule?.PatientAppId ||
        0
    );
    setError("");
    if (patientAppId > 0) {
      setSaving(true);
      try {
        const response = await collectAtReception({
          patientAppId,
          method: paymentMethod,
          amount: Number(amount) || 0,
        });
        const body = unwrapS4(response) || response;
        const printed = body?.receipt || response?.receipt || body?.data || body;
        setReceipt(printed);
        onPaymentConfirmed?.({
          patient: selectedPatient,
          schedule: allottedSchedule,
          paymentMethod,
          amount: Number(amount) || 0,
          gst,
          total,
          paymentStatus: paymentMethod === "PAY_LINK" ? "Unpaid" : paymentStatus,
          notes: notes.trim(),
          receipt: printed,
        });
        if (paymentMethod !== "PAY_LINK") {
          const win = window.open("", "_blank", "width=480,height=640");
          if (win) {
            win.document.write(
              `<html><body><h3>Homeocentrum receipt</h3>
              <p>Visit #${printed.patientAppId || printed.PatientAppId || patientAppId}</p>
              <p>Amount ${printed.amount || printed.Amount || amount}</p>
              <p>Method ${printed.method || printed.Method || paymentMethod}</p>
              <p>GST ${printed.gstAmount ?? printed.GstAmount ?? gst} (${printed.gstNote || printed.GstNote || "placeholder"})</p>
              <script>window.print();</script></body></html>`
            );
            win.document.close();
          }
        }
      } catch (err) {
        setError(s4Message(err));
        setSaving(false);
        return;
      }
      setSaving(false);
    } else {
      onPaymentConfirmed?.({
        patient: selectedPatient,
        schedule: allottedSchedule,
        paymentMethod,
        amount: Number(amount) || 0,
        gst,
        total,
        paymentStatus: paymentMethod === "PAY_LINK" ? "Unpaid" : paymentStatus,
        notes: notes.trim(),
      });
    }
    if (paymentMethod !== "PAY_LINK") resetAndClose();
  };

  const downloadInvoice = async () => {
    const paymentOrderId = receipt?.paymentOrderId || receipt?.PaymentOrderId;
    if (!paymentOrderId) return;
    try {
      await createInvoiceByPayment(paymentOrderId);
      await getInvoiceByPayment(paymentOrderId);
    } catch (err) {
      setError(s4Message(err));
    }
  };

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      toggle={resetAndClose}
      className="patient-list-modal reception-collect-payment-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header" toggle={resetAndClose}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-wallet-3-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span>
            <span className="patient-list-modal__title-text d-block">
              {editMode ? "Edit Payment" : "Collect Payment"}
            </span>
            <span className="reception-payment-subtitle">
              {editMode ? "Update consultation payment" : "Record consultation payment"}
            </span>
          </span>
        </span>
      </ModalHeader>

      <ModalBody>
        {error ? <p className="text-danger px-1">{error}</p> : null}
        <div className="reception-payment-layout">
          <div className="reception-payment-summary">
            <div className="reception-payment-summary__row">
              <span className="label">Patient</span>
              <strong>{selectedPatient?.fullName || "—"}</strong>
            </div>
            <div className="reception-payment-summary__row">
              <span className="label">Doctor</span>
              <strong>{allottedSchedule?.doctor?.label || "—"}</strong>
            </div>
            <div className="reception-payment-summary__row">
              <span className="label">Appointment</span>
              <strong>{appointmentLabel}</strong>
            </div>
            <div className="reception-payment-summary__fee">
              <span>Consultation Fee</span>
              <strong>{formatRupee(consultationFee)}</strong>
            </div>
          </div>

          <div className="reception-payment-form">
            <div className="mb-3">
              <Label className="form-label new-patient-modal__label mb-2">Payment Method</Label>
              <div className="reception-payment-methods" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map((method) => (
                    <label
                    key={method.value}
                    className={`reception-payment-method${paymentMethod === method.value ? " is-active" : ""}`}
                    >
                    <Input
                      type="radio"
                      name="receptionPaymentMethod"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    <span>{method.label}</span>
                    </label>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <Label className="form-label new-patient-modal__label">
                Amount <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="reception-payment-totals">
              <div className="reception-payment-totals__row">
                <span>GST / Tax</span>
                <strong>{formatRupee(gst)}</strong>
              </div>
              <div className="reception-payment-totals__row reception-payment-totals__row--total">
                <span>Total</span>
                <strong>{formatRupee(total)}</strong>
              </div>
            </div>

            <div className="reception-payment-status-row mb-3">
              <span className="label">Payment Status</span>
              <button
                type="button"
                className={`reception-payment-status-btn${paymentStatus === "Paid" ? " is-paid" : ""}`}
                onClick={() =>
                  setPaymentStatus((prev) => (prev === "Paid" ? "Unpaid" : "Paid"))
                }
              >
                <i className={paymentStatus === "Paid" ? "ri-checkbox-circle-fill" : "ri-close-circle-line"} />
                {paymentStatus}
              </button>
            </div>

            <div>
              <Label className="form-label new-patient-modal__label">Notes</Label>
              <Input
                type="textarea"
                rows={2}
                placeholder="Optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {receipt ? (
              <div className="mt-3 small">
                {receipt.payLinkUrl || receipt.PayLinkUrl ? (
                  <p className="mb-1">
                    Pay-link reserved (visit stays unpaid). Share:{" "}
                    <code>
                      {typeof window !== "undefined"
                        ? `${window.location.origin}${receipt.payLinkUrl || receipt.PayLinkUrl}`
                        : receipt.payLinkUrl || receipt.PayLinkUrl}
                    </code>
                  </p>
                ) : null}
                <p className="mb-0 text-muted">
                  Receipt #{receipt.paymentOrderId || receipt.PaymentOrderId} ·{" "}
                  {receipt.gstNote || receipt.GstNote || ""}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer">
        <ModalActionButton action="cancel" type="button" onClick={resetAndClose}>
          Cancel
        </ModalActionButton>
        {receipt?.paymentOrderId || receipt?.PaymentOrderId ? (
          <ModalActionButton action="cancel" type="button" onClick={downloadInvoice}>
            Invoice
          </ModalActionButton>
        ) : null}
        <ModalActionButton
          action="save"
          type="button"
          iconClassName="ri-check-line"
          disabled={saving}
          onClick={handleConfirm}
        >
          {saving ? "Saving..." : editMode ? "Save Payment" : "Confirm Payment"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default CollectPaymentModal;
