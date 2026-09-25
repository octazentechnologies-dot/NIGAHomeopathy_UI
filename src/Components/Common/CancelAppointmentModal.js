import React, { useEffect, useState } from "react";
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import Swal from "sweetalert2";
import { cancelAppointment } from "../../helpers/realbackend_helper";

export const CANCEL_REASONS = [
  { value: "PatientRequest", label: "Patient request" },
  { value: "DoctorUnavailable", label: "Doctor unavailable" },
  { value: "Duplicate", label: "Duplicate" },
  { value: "Other", label: "Other" },
];

const messageOf = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || error?.message || fallback;

const CancelAppointmentModal = ({ isOpen, toggle, patientAppId, onSaved }) => {
  const [reasonCode, setReasonCode] = useState("PatientRequest");
  const [reasonText, setReasonText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReasonCode("PatientRequest");
    setReasonText("");
  }, [isOpen]);

  const saveCancel = async () => {
    if (reasonCode === "Other" && !reasonText.trim()) {
      Swal.fire({ icon: "warning", text: "Other needs a reason." });
      return;
    }
    setBusy(true);
    try {
      await cancelAppointment({
        patientAppId: Number(patientAppId),
        reasonCode,
        reasonText,
      });
      toggle?.();
      Swal.fire({
        icon: "success",
        text: "Appointment cancelled. The slot is free.",
        timer: 1400,
        showConfirmButton: false,
      });
      if (onSaved) onSaved();
    } catch (error) {
      Swal.fire({ icon: "error", text: messageOf(error, "Could not cancel.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Cancel appointment</ModalHeader>
      <ModalBody>
        <Label>Reason</Label>
        <Input type="select" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
          {CANCEL_REASONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </Input>
        {reasonCode === "Other" ? (
          <>
            <Label className="mt-2">Details</Label>
            <Input value={reasonText} onChange={(event) => setReasonText(event.target.value)} />
          </>
        ) : null}
        <p className="text-muted small mt-2">Payment is not refunded from this screen.</p>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" disabled={busy || !patientAppId} onClick={saveCancel}>Cancel visit</Button>
      </ModalFooter>
    </Modal>
  );
};

export default CancelAppointmentModal;
