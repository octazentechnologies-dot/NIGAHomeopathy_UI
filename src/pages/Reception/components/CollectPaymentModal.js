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

const PAYMENT_METHODS = ["Cash", "UPI", "Card"];
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

  const handleConfirm = () => {
    onPaymentConfirmed?.({
      patient: selectedPatient,
      schedule: allottedSchedule,
      paymentMethod,
      amount: Number(amount) || 0,
      gst,
      total,
      paymentStatus,
      notes: notes.trim(),
    });
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
          onClick={handleConfirm}
        >
          {editMode ? "Save Payment" : "Confirm Payment"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default CollectPaymentModal;
