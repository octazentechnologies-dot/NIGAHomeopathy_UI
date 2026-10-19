import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import ModalActionButton from "../../../../Components/Common/ModalActionButton";
import { collectAtReception } from "../../../../helpers/s4Week4Api";
import { apiMessage } from "../../receptionSession";

const PAYMENT_METHODS = ["Cash", "UPI", "Card"];
const METHOD_API = { Cash: "CASH", UPI: "UPI_OFFLINE", Card: "CARD_POS" };
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
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [amount, setAmount] = useState(String(DEFAULT_FEE));
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setPaymentMethod(initialPayment?.paymentMethod || "UPI");
    setAmount(String(initialPayment?.amount ?? consultationFee ?? DEFAULT_FEE));
    setPaymentStatus(initialPayment?.paymentStatus || "Paid");
    setNotes(initialPayment?.notes || "");
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
    setError("");
    const confirmed = {
      patient: selectedPatient,
      schedule: allottedSchedule,
      paymentMethod,
      amount: Number(amount) || 0,
      gst,
      total,
      paymentStatus,
      notes: notes.trim(),
    };
    const patientAppId = Number(
      selectedPatient?.patientAppId || allottedSchedule?.patientAppId || 0
    );
    if (paymentStatus === "Paid") {
      if (!patientAppId) {
        setError("Book the appointment first so the payment can be recorded.");
        return;
      }
      setSaving(true);
      try {
        await collectAtReception({
          patientAppId,
          method: METHOD_API[paymentMethod] || "CASH",
          amount: Number(amount) || 0,
        });
        onPaymentConfirmed?.(confirmed);
        resetAndClose();
      } catch (err) {
        setError(apiMessage(err, "Could not record the payment."));
      } finally {
        setSaving(false);
      }
      return;
    }
    onPaymentConfirmed?.(confirmed);
    resetAndClose();
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
        {error ? <Alert color="danger">{error}</Alert> : null}
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
                    key={method}
                    className={`reception-payment-method${paymentMethod === method ? " is-active" : ""}`}
                  >
                    <Input
                      type="radio"
                      name="receptionPaymentMethod"
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                    <span>{method}</span>
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
              <div
                className="reception-payment-status-toggle"
                role="group"
                aria-label="Payment status"
              >
                <button
                  type="button"
                  className={`reception-payment-status-option${paymentStatus === "Unpaid" ? " is-unpaid" : ""}`}
                  aria-pressed={paymentStatus === "Unpaid"}
                  onClick={() => setPaymentStatus("Unpaid")}
                >
                  <i className="ri-close-circle-line" aria-hidden="true" />
                  Unpaid
                </button>
                <button
                  type="button"
                  className={`reception-payment-status-option${paymentStatus === "Paid" ? " is-paid" : ""}`}
                  aria-pressed={paymentStatus === "Paid"}
                  onClick={() => setPaymentStatus("Paid")}
                >
                  <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                  Paid
                </button>
              </div>
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
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer">
        <ModalActionButton action="cancel" type="button" onClick={resetAndClose}>
          Cancel
        </ModalActionButton>
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
