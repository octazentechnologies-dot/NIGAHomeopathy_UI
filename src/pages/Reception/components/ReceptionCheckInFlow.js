import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "reactstrap";
import { saveReceptionCasePaper } from "../../../helpers/realbackend_helper";
import { apiMessage } from "../receptionSession";
import QuickActions from "./QuickActions";
import EditAppointmentStepsModal from "./EditAppointmentStepsModal";
import BookAppointmentModal from "./BookAppointmentModal";
import CollectVitalsModal from "./CollectVitalsModal";
import CollectPaymentModal from "./CollectPaymentModal";
import CasePaperModal from "./CasePaperModal";

const vitalsKey = (patientAppId) => `reception.vitals.${patientAppId}`;

export const readStoredVitals = (patientAppId) => {
  if (!patientAppId) return null;
  try {
    const raw = sessionStorage.getItem(vitalsKey(patientAppId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredVitals = (patientAppId, vitals) => {
  if (!patientAppId || !vitals) return;
  try {
    sessionStorage.setItem(vitalsKey(patientAppId), JSON.stringify(vitals));
  } catch {
    /* ignore quota */
  }
};

const patientFromRow = (row) => {
  if (!row) return null;
  const details = row.patientDetails || {};
  return {
    id: row.patientId || details.patientId,
    patientId: row.patientId || details.patientId,
    patientAppId: row.patientAppId || row.PatientAppId || row.id,
    fullName: details.fullName || row.patient || row.patientName || row.PatientName || "Patient",
    age: details.ageSex || row.age || row.Age,
    sex: details.sex,
    mobileNo: details.mobile || row.mobileNo || row.MobileNo,
  };
};

const scheduleFromRow = (row) => {
  if (!row) return null;
  return {
    patientAppId: row.patientAppId || row.PatientAppId || row.id,
    dateDisplay: row.dateDisplay || row.appointmentDate || "—",
    slot: { label: row.time || row.appointmentTime || "—" },
    doctor: { label: row.doctor || row.doctorName || "Doctor" },
  };
};

/**
 * UI-developer reception check-in desk: Quick Actions + step modals.
 * Payment and case paper call the API. Vitals stay on this desk until a vitals API exists.
 *
 * Pass `checkInRow` when the appointment Edit button should open the step picker.
 */
const ReceptionCheckInFlow = ({
  selectedRow = null,
  checkInRow = null,
  onSelectRow,
  onCheckInHandled,
  onPaymentConfirmed,
  onOpenNewPatient,
  onOpenBookAppointment,
  consultationFee,
}) => {
  const navigate = useNavigate();
  const [activeActionId, setActiveActionId] = useState(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [casePaperOpen, setCasePaperOpen] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [vitalsDetails, setVitalsDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [casePaperDetails, setCasePaperDetails] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeRow = selectedRow || checkInRow;
  const selectedPatient = useMemo(() => patientFromRow(activeRow), [activeRow]);
  const allottedSchedule = useMemo(() => scheduleFromRow(activeRow), [activeRow]);
  const patientAppId = selectedPatient?.patientAppId;

  useEffect(() => {
    if (!checkInRow) return;
    onSelectRow?.(checkInRow);
    setVitalsDetails(readStoredVitals(checkInRow.patientAppId || checkInRow.id));
    setStepsOpen(true);
    setActiveActionId(null);
    setError("");
    onCheckInHandled?.();
  }, [checkInRow, onSelectRow, onCheckInHandled]);

  const completedActionIds = useMemo(() => {
    const done = [];
    if (selectedPatient) done.push("patient-details");
    if (allottedSchedule?.slot?.label) done.push("doctor-schedule");
    if (appointmentDetails?.chiefComplaints) done.push("new-appointment");
    if (vitalsDetails?.bloodPressure || readStoredVitals(patientAppId)?.bloodPressure) {
      done.push("collect-vitals");
    }
    if (
      paymentDetails?.paymentStatus ||
      String(activeRow?.paymentStatusRaw || activeRow?.paymentStatus || "").toUpperCase() === "PAID"
    ) {
      done.push("collect-payment");
    }
    if (casePaperDetails?.casePaperNo) done.push("case-paper");
    return done;
  }, [
    selectedPatient,
    allottedSchedule,
    appointmentDetails,
    vitalsDetails,
    paymentDetails,
    casePaperDetails,
    patientAppId,
    activeRow,
  ]);

  const requireVisit = useCallback(() => {
    if (patientAppId) return true;
    setError("Pick a visit from today's appointments first (use Edit on a row).");
    return false;
  }, [patientAppId]);

  const openStep = useCallback(
    (actionId) => {
      setError("");
      setNotice("");
      setActiveActionId(actionId);
      setStepsOpen(false);

      if (actionId === "patient-details") {
        if (!requireVisit()) return;
        setNotice(`Patient: ${selectedPatient.fullName}. Use View on the appointment row for the full card.`);
        return;
      }
      if (actionId === "doctor-schedule") {
        navigate("/reception/schedule");
        return;
      }
      if (actionId === "new-appointment") {
        if (onOpenBookAppointment && !activeRow) {
          onOpenBookAppointment();
          return;
        }
        if (!requireVisit()) return;
        setBookOpen(true);
        return;
      }
      if (actionId === "collect-vitals") {
        if (!requireVisit()) return;
        setVitalsDetails(readStoredVitals(patientAppId));
        setVitalsOpen(true);
        return;
      }
      if (actionId === "collect-payment") {
        if (!requireVisit()) return;
        setPaymentOpen(true);
        return;
      }
      if (actionId === "case-paper") {
        if (!requireVisit()) return;
        setCasePaperOpen(true);
      }
    },
    [navigate, onOpenBookAppointment, patientAppId, requireVisit, selectedPatient, activeRow]
  );

  return (
    <>
      {error ? (
        <Alert color="danger" toggle={() => setError("")} className="mt-2">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert color="info" toggle={() => setNotice("")} className="mt-2">
          {notice}
        </Alert>
      ) : null}

      <QuickActions
        onActionClick={openStep}
        completedActionIds={completedActionIds}
        activeActionId={activeActionId}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        appointmentDetails={appointmentDetails}
        vitalsDetails={vitalsDetails || readStoredVitals(patientAppId)}
        paymentDetails={paymentDetails}
        casePaperDetails={casePaperDetails}
      />

      {!selectedPatient ? (
        <p className="text-muted small mt-2 mb-0">
          Select a visit with Edit on today's list
          {onOpenNewPatient ? (
            <>
              , or{" "}
              <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={onOpenNewPatient}>
                register a new patient
              </button>
            </>
          ) : (
            "."
          )}
        </p>
      ) : null}

      <EditAppointmentStepsModal
        isOpen={stepsOpen}
        toggle={() => setStepsOpen(false)}
        selectedPatient={selectedPatient}
        completedActionIds={completedActionIds}
        onSelectStep={openStep}
      />

      <BookAppointmentModal
        isOpen={bookOpen}
        toggle={() => setBookOpen(false)}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        initialAppointment={appointmentDetails}
        editMode={Boolean(appointmentDetails)}
        onAppointmentConfirmed={(details) => {
          setAppointmentDetails(details);
          setNotice("Chief complaint saved for this check-in. Collect vitals or payment next.");
        }}
      />

      <CollectVitalsModal
        isOpen={vitalsOpen}
        toggle={() => setVitalsOpen(false)}
        selectedPatient={selectedPatient}
        initialVitals={vitalsDetails || readStoredVitals(patientAppId)}
        editMode={Boolean(vitalsDetails || readStoredVitals(patientAppId))}
        onVitalsConfirmed={(details) => {
          const stored = {
            ...details,
            bloodPressureSystolic: details.bloodPressureSystolic,
            bloodPressureDiastolic: details.bloodPressureDiastolic,
            bloodPressure: details.bloodPressure,
          };
          setVitalsDetails(stored);
          writeStoredVitals(patientAppId, stored);
          setNotice("Vitals stored for this visit on this desk.");
        }}
      />

      <CollectPaymentModal
        isOpen={paymentOpen}
        toggle={() => setPaymentOpen(false)}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        consultationFee={consultationFee}
        initialPayment={paymentDetails}
        editMode={Boolean(paymentDetails)}
        onPaymentConfirmed={(details) => {
          setPaymentDetails(details);
          onPaymentConfirmed?.(details, activeRow);
          setNotice("Payment recorded.");
        }}
      />

      <CasePaperModal
        isOpen={casePaperOpen}
        toggle={() => setCasePaperOpen(false)}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        appointmentDetails={appointmentDetails}
        vitalsDetails={vitalsDetails || readStoredVitals(patientAppId)}
        paymentDetails={paymentDetails}
        onCasePaperConfirmed={async (details) => {
          setCasePaperDetails(details);
          const pid = Number(selectedPatient?.patientId || selectedPatient?.id);
          const complaint =
            appointmentDetails?.chiefComplaints || details?.appointment?.chiefComplaints || "";
          if (pid && complaint) {
            try {
              await saveReceptionCasePaper({
                patientId: pid,
                caseId: null,
                chiefComplaint: String(complaint).trim(),
              });
              setNotice("Case paper saved for the doctor.");
            } catch (err) {
              setError(apiMessage(err, "Case paper printed, but could not save for the doctor."));
            }
          } else {
            setNotice(
              "Case paper ready to print. Add a chief complaint on Book Appointment to save for the doctor."
            );
          }
        }}
      />
    </>
  );
};

export default ReceptionCheckInFlow;
