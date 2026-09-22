import React, { useState } from "react";
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import Swal from "sweetalert2";
import { cancelAppointment, getAppointmentSlots, rescheduleAppointment } from "../../../helpers/realbackend_helper";
import { formatApiDate, normalizeAppointmentSlotsResponse } from "../../../helpers/appointmentSlotHelper";

const CANCEL_REASONS = [
  { value: "PatientRequest", label: "Patient request" },
  { value: "DoctorUnavailable", label: "Doctor unavailable" },
  { value: "Duplicate", label: "Duplicate" },
  { value: "Other", label: "Other" },
];

const messageOf = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || error?.message || fallback;

const AppointmentChangeActions = ({ patientAppId, doctorId, appointmentDate, onChanged }) => {
  const [open, setOpen] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [reasonCode, setReasonCode] = useState("PatientRequest");
  const [reasonText, setReasonText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!patientAppId) return null;

  const loadSlots = async (nextDate) => {
    const appointmentDateValue = formatApiDate(nextDate);
    if (!doctorId || !appointmentDateValue) return;
    const response = await getAppointmentSlots({
      doctorId,
      appointmentDate: appointmentDateValue,
      currentPatientAppId: patientAppId,
    });
    const parsed = normalizeAppointmentSlotsResponse(response?.data ?? response);
    setSlots((parsed.slots || []).filter((slot) => slot.status === "available"));
  };

  const openReschedule = async () => {
    const initial = formatApiDate(appointmentDate) || new Date().toISOString().slice(0, 10);
    setDate(initial);
    setTime("");
    setReason("");
    setOpen("reschedule");
    try {
      await loadSlots(initial);
    } catch (error) {
      Swal.fire({ icon: "error", text: messageOf(error, "Could not load slots.") });
    }
  };

  const saveReschedule = async () => {
    setBusy(true);
    try {
      await rescheduleAppointment({
        patientAppId: Number(patientAppId),
        appointmentDate: date,
        appointmentTime: time.length === 5 ? `${time}:00` : time,
        reason,
      });
      setOpen(null);
      Swal.fire({
        icon: "success",
        text: "Reschedule recorded. SMS and WhatsApp are not sent.",
        timer: 1600,
        showConfirmButton: false,
      });
      if (onChanged) onChanged();
    } catch (error) {
      Swal.fire({ icon: "error", text: messageOf(error, "Could not reschedule.") });
    } finally {
      setBusy(false);
    }
  };

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
      setOpen(null);
      Swal.fire({ icon: "success", text: "Appointment cancelled. The slot is free.", timer: 1400, showConfirmButton: false });
      if (onChanged) onChanged();
    } catch (error) {
      Swal.fire({ icon: "error", text: messageOf(error, "Could not cancel.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" color="soft-info" className="dashboard-appointment-text-btn" onClick={openReschedule}>Reschedule</Button>
      <Button size="sm" color="soft-danger" className="dashboard-appointment-text-btn" onClick={() => setOpen("cancel")}>Cancel</Button>
      <Modal isOpen={open === "reschedule"} toggle={() => setOpen(null)}>
        <ModalHeader toggle={() => setOpen(null)}>Reschedule</ModalHeader>
        <ModalBody>
          <p className="text-muted small">
            This records the new time. A quiet time edit on the row does not. No SMS or WhatsApp is sent.
          </p>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(event) => { setDate(event.target.value); loadSlots(event.target.value); }} />
          <Label className="mt-2">Open slot</Label>
          <Input type="select" value={time} onChange={(event) => setTime(event.target.value)}>
            <option value="">Select</option>
            {slots.map((slot) => (
              <option key={slot.time} value={slot.time}>{slot.label || slot.time}</option>
            ))}
          </Input>
          <Label className="mt-2">Reason (optional)</Label>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" disabled={busy || !time} onClick={saveReschedule}>Save</Button>
        </ModalFooter>
      </Modal>
      <Modal isOpen={open === "cancel"} toggle={() => setOpen(null)}>
        <ModalHeader toggle={() => setOpen(null)}>Cancel appointment</ModalHeader>
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
          <Button color="danger" disabled={busy} onClick={saveCancel}>Cancel visit</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AppointmentChangeActions;
