import React, { useEffect, useState } from "react";
import { Alert, Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import Swal from "sweetalert2";
import moment from "moment";
import { getAppointmentSlots, rescheduleAppointment } from "../../helpers/realbackend_helper";
import { formatApiDate, normalizeAppointmentSlotsResponse, timeInputToApiTime } from "../../helpers/appointmentSlotHelper";
import { formatRescheduleDate, formatRescheduleTime, readRescheduleFailure } from "../../helpers/rescheduleDisplay";

const RescheduleModal = ({
  isOpen,
  toggle,
  patientAppId,
  doctorId,
  appointmentDate,
  appointmentTime,
  onSaved,
}) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotNote, setSlotNote] = useState("");
  const [errorText, setErrorText] = useState("");
  const [alternatives, setAlternatives] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadSlots = async (nextDate) => {
    const appointmentDateValue = formatApiDate(nextDate);
    if (!doctorId || !appointmentDateValue) {
      setSlots([]);
      setSlotNote(doctorId ? "" : "Doctor is required before slots can load.");
      return;
    }
    setSlotNote("Loading open slots…");
    try {
      const response = await getAppointmentSlots({
        doctorId,
        appointmentDate: appointmentDateValue,
        currentPatientAppId: patientAppId,
      });
      const parsed = normalizeAppointmentSlotsResponse(response?.data ?? response);
      const open = (parsed.slots || []).filter((slot) => slot.status === "available" && slot.time);
      setSlots(open);
      setSlotNote(
        open.length
          ? `${open.length} open slot${open.length === 1 ? "" : "s"}`
          : parsed.hasSchedule
            ? "No open slots on this date."
            : "Daily schedule is not configured for this date."
      );
    } catch (error) {
      setSlots([]);
      setSlotNote(readRescheduleFailure(error).message || "Could not load slots.");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const initial = formatApiDate(appointmentDate) || moment().format("YYYY-MM-DD");
    setDate(initial);
    setTime("");
    setReason("");
    setErrorText("");
    setAlternatives([]);
    loadSlots(initial);
  }, [isOpen, patientAppId, doctorId, appointmentDate]);

  const onDateChange = (value) => {
    setDate(value);
    setTime("");
    setErrorText("");
    setAlternatives([]);
    loadSlots(value);
  };

  const save = async () => {
    const appointmentTimeValue = timeInputToApiTime(time);
    if (!patientAppId || !date || !appointmentTimeValue) return;
    setBusy(true);
    setErrorText("");
    try {
      await rescheduleAppointment({
        patientAppId: Number(patientAppId),
        appointmentDate: date,
        appointmentTime: appointmentTimeValue,
        reason: reason.trim() ? reason.trim() : null,
      });
      if (toggle) toggle();
      Swal.fire({
        icon: "success",
        text: "Appointment rescheduled. Reschedule is the patient-notified path.",
        timer: 1800,
        showConfirmButton: false,
      });
      if (onSaved) onSaved();
    } catch (error) {
      const failure = readRescheduleFailure(error);
      setErrorText(failure.message);
      setAlternatives(failure.alternatives);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Reschedule appointment</ModalHeader>
      <ModalBody>
        <p className="text-muted small">
          Reschedule is the patient-notified path. A quiet time edit on the row does not notify the patient.
        </p>
        <div className="border rounded p-2 mb-3 bg-light" id={`reschedule-current-${patientAppId || "none"}`}>
          <div className="text-muted small">Current appointment</div>
          <div className="fw-semibold">
            {formatRescheduleDate(appointmentDate)} · {formatRescheduleTime(appointmentTime)}
          </div>
        </div>
        {errorText ? <Alert color="danger">{errorText}</Alert> : null}
        <Label for={`reschedule-date-${patientAppId || "none"}`}>New date</Label>
        <Input
          id={`reschedule-date-${patientAppId || "none"}`}
          type="date"
          min={moment().format("YYYY-MM-DD")}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
        <Label className="mt-2" for={`reschedule-slot-${patientAppId || "none"}`}>New slot</Label>
        <Input
          id={`reschedule-slot-${patientAppId || "none"}`}
          type="select"
          value={time}
          onChange={(event) => setTime(event.target.value)}
        >
          <option value="">Select an open slot</option>
          {slots.map((slot) => (
            <option key={slot.time} value={slot.time}>{slot.label || formatRescheduleTime(slot.time)}</option>
          ))}
        </Input>
        {slotNote ? <p className="text-muted small mb-0 mt-1">{slotNote}</p> : null}
        {alternatives.length > 0 ? (
          <div className="mt-2">
            <div className="text-muted small">Other open slots</div>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {alternatives.map((slot) => (
                <Button
                  key={slot.time}
                  size="sm"
                  color="light"
                  type="button"
                  onClick={() => setTime(slot.time)}
                >
                  {slot.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <Label className="mt-2" for={`reschedule-reason-${patientAppId || "none"}`}>Reason (optional)</Label>
        <Input
          id={`reschedule-reason-${patientAppId || "none"}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional"
        />
      </ModalBody>
      <ModalFooter>
        <Button color="light" type="button" onClick={toggle} disabled={busy}>Close</Button>
        <Button id={`reschedule-save-${patientAppId || "none"}`} color="primary" type="button" disabled={busy || !time} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RescheduleModal;
