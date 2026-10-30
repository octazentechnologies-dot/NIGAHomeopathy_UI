import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Col,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import Swal from "sweetalert2";
import AssistedBookWizard from "../../../Components/Common/AssistedBookWizard";
import CancelAppointmentModal from "../../../Components/Common/CancelAppointmentModal";
import RescheduleModal from "../../../Components/Common/RescheduleModal";
import {
  formatApiDate,
  normalizeAppointmentSlotsResponse,
  timeInputToApiTime,
} from "../../../helpers/appointmentSlotHelper";
import {
  callNextAppointment,
  getAppointmentSlots,
  updateAppointmentTime,
} from "../../../helpers/realbackend_helper";
import { getPublicFee, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";
import { apiMessage, readReceptionDoctorId } from "../receptionSession";
import ReceptionCheckInFlow from "../components/ReceptionCheckInFlow";
import ReceptionNewPatientForm from "../components/ReceptionNewPatientForm";
import SummaryWidgets from "../components/SummaryWidgets";
import TodaysAppointments from "../components/TodaysAppointments";
import "../components/receptionDashboard.css";

/**
 * Reception desk — UI-developer layout only:
 * SummaryWidgets + Quick Actions (check-in steps) + Today's appointments.
 * All steps are API-bound (queue, vitals, case paper, payment, booking).
 */
const ReceptionDashboard = () => {
  document.title = "Reception | Homeocentrum";
  const navigate = useNavigate();
  const location = useLocation();
  const doctorId = readReceptionDoctorId();

  const [selectedRow, setSelectedRow] = useState(null);
  const [checkInRow, setCheckInRow] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [paymentPatch, setPaymentPatch] = useState(null);
  const [feeByType, setFeeByType] = useState({ inClinic: null, tele: null });
  const [deskPanel, setDeskPanel] = useState(null); // null | "patient" | "appointment"
  const [assistedPatientId, setAssistedPatientId] = useState("");
  const [assistedPatientName, setAssistedPatientName] = useState("");
  const [assistedPickKey, setAssistedPickKey] = useState(0);
  const [rescheduleRow, setRescheduleRow] = useState(null);
  const [timeEditRow, setTimeEditRow] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [callingNext, setCallingNext] = useState(false);

  const clearCheckIn = useCallback(() => setCheckInRow(null), []);
  const bumpList = useCallback(() => setListRefreshKey((n) => n + 1), []);

  const openNewPatient = useCallback(() => {
    setDeskPanel("patient");
    setBanner("");
  }, []);

  const openBookAppointment = useCallback(() => {
    setDeskPanel("appointment");
    setBanner("");
  }, []);

  useEffect(() => {
    const hash = (location.hash || "").replace(/^#/, "");
    if (hash === "reception-new-patient") openNewPatient();
    if (hash === "reception-assisted") openBookAppointment();
  }, [location.hash, openNewPatient, openBookAppointment]);

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    getPublicFee(doctorId)
      .then((response) => {
        if (cancelled) return;
        const fee = unwrapS4(response) || {};
        const data = fee.data || fee.Data || fee;
        setFeeByType({
          inClinic: data.inClinicFee ?? data.InClinicFee ?? null,
          tele: data.teleFee ?? data.TeleFee ?? data.inClinicFee ?? data.InClinicFee ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setFeeByType({ inClinic: null, tele: null });
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const consultationFee = useMemo(() => {
    const row = selectedRow || checkInRow;
    if (!row) return feeByType.inClinic;
    const tele = String(row.type || "").toLowerCase().includes("tele");
    const fromRow = Number(String(row.payment || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(fromRow) && fromRow > 0) return fromRow;
    return tele ? feeByType.tele : feeByType.inClinic;
  }, [selectedRow, checkInRow, feeByType]);

  const pickSharedPatient = (patientId, label) => {
    if (!patientId) return;
    setAssistedPatientId(String(patientId));
    setAssistedPatientName(label || "");
    setAssistedPickKey((k) => k + 1);
    setDeskPanel("appointment");
    setBanner(`Patient ready for booking: ${label || patientId}`);
  };

  const callNext = async () => {
    if (!doctorId || callingNext) return;
    setCallingNext(true);
    setError("");
    try {
      const response = await callNextAppointment(doctorId);
      const body = response?.data ?? response ?? {};
      const data = body.data || body.Data || body;
      const name = data.patientName || data.PatientName || "Patient";
      const id = data.patientAppId || data.PatientAppId;
      setBanner(id ? `Called next: ${name} (#${id})` : `Called next: ${name}`);
      bumpList();
    } catch (err) {
      setError(apiMessage(err, "Could not call next patient."));
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page reception-dashboard-page">
      <Container fluid>
        <div className="clinic-page-header d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <h2 className="clinic-page-title mb-0"><i className="ri-customer-service-2-line" aria-hidden="true" />Reception</h2>
            <p className="clinic-page-subtitle mb-0">Check-in, vitals, payment, and today’s visits</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              size="sm"
              color="soft-success"
              disabled={!doctorId || callingNext}
              onClick={callNext}
            >
              {callingNext ? <Spinner size="sm" /> : <i className="ri-volume-up-line me-1" aria-hidden="true" />}
              Call next
            </Button>
            <Button size="sm" color="soft-primary" onClick={openNewPatient}>
              <i className="ri-user-add-line me-1" aria-hidden="true" />
              New patient
            </Button>
            <Button size="sm" className="btn btn-sm btn-soft-primary" onClick={openBookAppointment}>
              <i className="ri-calendar-check-line me-1" aria-hidden="true" />
              Book appointment
            </Button>
            <Button size="sm" color="soft-info" onClick={() => navigate("/reception/schedule")}>
              <i className="ri-calendar-line me-1" aria-hidden="true" />
              Schedule
            </Button>
          </div>
        </div>

        {!doctorId ? (
          <Alert color="warning" className="mt-2">
            Reception doctor context is missing. Sign in again with a reception account linked to a doctor.
          </Alert>
        ) : null}
        {error ? (
          <Alert color="danger" toggle={() => setError("")} className="mt-2">
            {error}
          </Alert>
        ) : null}
        {banner ? (
          <Alert color="success" toggle={() => setBanner("")} className="mt-2">
            {banner}
          </Alert>
        ) : null}

        <SummaryWidgets refreshKey={listRefreshKey} />

        <ReceptionCheckInFlow
          selectedRow={selectedRow}
          checkInRow={checkInRow}
          consultationFee={consultationFee}
          onSelectRow={setSelectedRow}
          onCheckInHandled={clearCheckIn}
          onOpenNewPatient={openNewPatient}
          onOpenBookAppointment={openBookAppointment}
          onVisitStatusChanged={() => bumpList()}
          onPaymentConfirmed={(details, row) => {
            const patientAppId = row?.patientAppId || details?.patientAppId;
            if (!patientAppId) return;
            setPaymentPatch({
              patientAppId,
              paymentStatus: "PAID",
              paymentMethod: details?.paymentMethod || details?.method,
              at: Date.now(),
            });
            bumpList();
            setBanner("Payment recorded for this visit.");
          }}
        />

        <TodaysAppointments
          refreshKey={listRefreshKey}
          paymentPatch={paymentPatch}
          onCheckInEdit={(row) => {
            setSelectedRow(row);
            setCheckInRow(row);
          }}
          onEditAppointment={(row) => setTimeEditRow(row)}
          onReschedule={(row) => setRescheduleRow(row)}
          onCancel={(row) => setCancelRow(row)}
        />

        <Modal isOpen={deskPanel === "patient"} toggle={() => setDeskPanel(null)} size="md" centered>
          <ModalHeader toggle={() => setDeskPanel(null)}><i className="ri-add-circle-line" aria-hidden="true" />New patient</ModalHeader>
          <ModalBody>
            <ReceptionNewPatientForm
              onCreated={(created) => {
                const label = `${created.patientName}${created.mobileNo ? ` · ${created.mobileNo}` : ""}`;
                if (created.patientId) pickSharedPatient(created.patientId, label);
                else {
                  setBanner(`Patient registered: ${label}`);
                  setDeskPanel(null);
                }
              }}
            />
          </ModalBody>
        </Modal>

        <Modal
          isOpen={deskPanel === "appointment"}
          toggle={() => setDeskPanel(null)}
          size="xl"
          centered
          scrollable
        >
          <ModalHeader toggle={() => setDeskPanel(null)}><i className="ri-add-circle-line" aria-hidden="true" />Book appointment</ModalHeader>
          <ModalBody>
            <AssistedBookWizard
              doctorId={doctorId}
              showRequestQueue
              selectedPatientId={assistedPatientId}
              patientNameHint={assistedPatientName}
              patientPickKey={assistedPickKey}
              onPatientSelected={(picked) => pickSharedPatient(picked.patientId, picked.label)}
              onBooked={() => {
                bumpList();
                setDeskPanel(null);
                setBanner("Appointment booked.");
              }}
            />
          </ModalBody>
        </Modal>

        <UpdateAppointmentTimeModal
          isOpen={!!timeEditRow}
          toggle={() => setTimeEditRow(null)}
          doctorId={doctorId}
          patientAppId={timeEditRow?.patientAppId}
          appointmentDate={timeEditRow?.appointmentDate}
          onSaved={() => {
            bumpList();
            setTimeEditRow(null);
          }}
        />
        <RescheduleModal
          isOpen={!!rescheduleRow}
          toggle={() => setRescheduleRow(null)}
          patientAppId={rescheduleRow?.patientAppId || rescheduleRow?.PatientAppId}
          doctorId={doctorId}
          appointmentDate={rescheduleRow?.appointmentDate || rescheduleRow?.AppointmentDate}
          appointmentTime={rescheduleRow?.appointmentTime || rescheduleRow?.AppointmentTime}
          onSaved={() => {
            bumpList();
            setRescheduleRow(null);
          }}
        />
        <CancelAppointmentModal
          isOpen={!!cancelRow}
          toggle={() => setCancelRow(null)}
          patientAppId={cancelRow?.patientAppId || cancelRow?.PatientAppId}
          onSaved={() => {
            bumpList();
            setCancelRow(null);
          }}
        />
      </Container>
    </div>
  );
};

const UpdateAppointmentTimeModal = ({ isOpen, toggle, doctorId, patientAppId, appointmentDate, onSaved }) => {
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [note, setNote] = useState("");
  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState(false);
  const date = formatApiDate(appointmentDate);

  useEffect(() => {
    if (!isOpen) return undefined;
    setTime("");
    setErrorText("");
    let cancelled = false;
    const loadSlots = async () => {
      if (!doctorId || !date) {
        setSlots([]);
        setNote(doctorId ? "This visit has no date." : "Doctor is required before slots can load.");
        return;
      }
      setNote("Loading open slots…");
      try {
        const response = await getAppointmentSlots({
          doctorId,
          appointmentDate: date,
          currentPatientAppId: patientAppId,
        });
        const parsed = normalizeAppointmentSlotsResponse(response?.data ?? response);
        const open = (parsed.slots || []).filter((slot) => slot.status === "available" && slot.time);
        if (cancelled) return;
        setSlots(open);
        setNote(open.length ? `${open.length} open slot${open.length === 1 ? "" : "s"} on this day.` : "No open slots on this day.");
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setNote(s4Message(err) || "Could not load slots.");
        }
      }
    };
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [isOpen, doctorId, patientAppId, date]);

  const save = async () => {
    const appointmentTimeValue = timeInputToApiTime(time);
    if (!patientAppId || !date || !appointmentTimeValue) return;
    setBusy(true);
    setErrorText("");
    try {
      await updateAppointmentTime({
        patientAppId: Number(patientAppId),
        appointmentDate: date,
        appointmentTime: appointmentTimeValue,
      });
      if (toggle) toggle();
      Swal.fire({
        icon: "success",
        text: "Appointment time updated. The patient is not notified. Use Reschedule when they should be told.",
        timer: 2200,
        showConfirmButton: false,
      });
      if (onSaved) onSaved();
    } catch (err) {
      setErrorText(s4Message(err) || "Could not update the time.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}><i className="ri-edit-line" aria-hidden="true" />Update appointment time</ModalHeader>
      <ModalBody>
        {errorText ? <Alert color="danger">{errorText}</Alert> : null}
        <Label>Date</Label>
        <Input value={date || "—"} disabled />
        <Label className="mt-2">New slot</Label>
        <Input type="select" value={time} onChange={(event) => setTime(event.target.value)}>
          <option value="">{note || "Select a slot"}</option>
          {slots.map((slot) => (
            <option key={slot.time} value={slot.time}>
              {slot.label || slot.time}
            </option>
          ))}
        </Input>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" disabled={busy || !time} onClick={save}>
          {busy ? "Saving…" : "Update time"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ReceptionDashboard;
