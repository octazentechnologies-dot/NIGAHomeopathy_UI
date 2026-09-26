import React, { useState } from "react";
import { Container } from "reactstrap";
import SummaryWidgets from "../components/SummaryWidgets";
import QuickActions from "../components/QuickActions";
import TodaysAppointments from "../components/TodaysAppointments";
import PatientDetailsModal from "../components/PatientDetailsModal";
import ReceptionDoctorScheduleModal from "../components/ReceptionDoctorScheduleModal";
import BookAppointmentModal from "../components/BookAppointmentModal";
import CollectVitalsModal from "../components/CollectVitalsModal";
import CollectPaymentModal from "../components/CollectPaymentModal";
import CasePaperModal from "../components/CasePaperModal";
import EditAppointmentStepsModal from "../components/EditAppointmentStepsModal";
import { mapAppointmentRowToCheckIn } from "../components/mapAppointmentToCheckIn";
import "../components/receptionDashboard.css";

const ReceptionDashboard = () => {
  document.title = "Reception Dashboard | Niga Homeocentrum";

  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [doctorScheduleOpen, setDoctorScheduleOpen] = useState(false);
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  const [collectVitalsOpen, setCollectVitalsOpen] = useState(false);
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [casePaperOpen, setCasePaperOpen] = useState(false);
  const [editStepsOpen, setEditStepsOpen] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);
  const [consultationFee, setConsultationFee] = useState(800);
  const [completedActionIds, setCompletedActionIds] = useState([]);
  const [activeActionId, setActiveActionId] = useState("patient-details");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [allottedSchedule, setAllottedSchedule] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [vitalsDetails, setVitalsDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [casePaperDetails, setCasePaperDetails] = useState(null);

  const markCompleted = (actionId) => {
    setCompletedActionIds((prev) => (prev.includes(actionId) ? prev : [...prev, actionId]));
  };

  const returnToEditSteps = () => {
    if (editingExisting) {
      setEditStepsOpen(true);
    }
  };

  const openActionStep = (actionId) => {
    setActiveActionId(actionId);
    if (actionId === "patient-details") {
      setPatientDetailsOpen(true);
      return;
    }
    if (actionId === "doctor-schedule") {
      setDoctorScheduleOpen(true);
      return;
    }
    if (actionId === "new-appointment") {
      setBookAppointmentOpen(true);
      return;
    }
    if (actionId === "collect-vitals") {
      setCollectVitalsOpen(true);
      return;
    }
    if (actionId === "collect-payment") {
      setCollectPaymentOpen(true);
      return;
    }
    if (actionId === "case-paper") {
      setCasePaperOpen(true);
    }
  };

  const handleActionClick = (actionId) => {
    if (editingExisting) {
      openActionStep(actionId);
      return;
    }

    if (actionId === "patient-details") {
      setPatientDetailsOpen(true);
      return;
    }
    if (actionId === "doctor-schedule") {
      if (!selectedPatient) {
        setPatientDetailsOpen(true);
        return;
      }
      setDoctorScheduleOpen(true);
      setActiveActionId("doctor-schedule");
      return;
    }
    if (actionId === "new-appointment") {
      if (!selectedPatient) {
        setPatientDetailsOpen(true);
        return;
      }
      if (!allottedSchedule) {
        setDoctorScheduleOpen(true);
        setActiveActionId("doctor-schedule");
        return;
      }
      setBookAppointmentOpen(true);
      setActiveActionId("new-appointment");
      return;
    }
    if (actionId === "collect-vitals") {
      if (!appointmentDetails) {
        if (!allottedSchedule) {
          handleActionClick("new-appointment");
          return;
        }
        setBookAppointmentOpen(true);
        return;
      }
      setCollectVitalsOpen(true);
      setActiveActionId("collect-vitals");
      return;
    }
    if (actionId === "collect-payment") {
      if (!vitalsDetails) {
        handleActionClick("collect-vitals");
        return;
      }
      setCollectPaymentOpen(true);
      setActiveActionId("collect-payment");
      return;
    }
    if (actionId === "case-paper") {
      if (!paymentDetails) {
        handleActionClick("collect-payment");
        return;
      }
      setCasePaperOpen(true);
      setActiveActionId("case-paper");
      return;
    }
    setActiveActionId(actionId);
  };

  const handleEditAppointment = (row) => {
    const mapped = mapAppointmentRowToCheckIn(row);
    if (!mapped) return;

    setEditingExisting(true);
    setSelectedPatient(mapped.selectedPatient);
    setAllottedSchedule(mapped.allottedSchedule);
    setAppointmentDetails(mapped.appointmentDetails);
    setVitalsDetails(mapped.vitalsDetails);
    setPaymentDetails(mapped.paymentDetails);
    setCompletedActionIds(mapped.completedActionIds);
    setConsultationFee(mapped.consultationFee || 800);
    setCasePaperDetails(null);
    setActiveActionId(mapped.preferredStep);
    setEditStepsOpen(true);
  };

  const handleSelectEditStep = (actionId) => {
    setEditStepsOpen(false);
    openActionStep(actionId);
  };

  const handlePatientConfirmed = (patient) => {
    setSelectedPatient(patient);
    markCompleted("patient-details");
    setActiveActionId("doctor-schedule");
    if (editingExisting) {
      returnToEditSteps();
      return;
    }
    setDoctorScheduleOpen(true);
  };

  const handleScheduleConfirmed = (schedule) => {
    setAllottedSchedule(schedule);
    markCompleted("doctor-schedule");
    setActiveActionId("new-appointment");
    if (editingExisting) {
      returnToEditSteps();
      return;
    }
    setBookAppointmentOpen(true);
  };

  const handleAppointmentConfirmed = (details) => {
    setAppointmentDetails(details);
    markCompleted("new-appointment");
    setActiveActionId("collect-vitals");
    if (editingExisting) {
      returnToEditSteps();
      return;
    }
    setCollectVitalsOpen(true);
  };

  const handleVitalsConfirmed = (vitals) => {
    setVitalsDetails(vitals);
    markCompleted("collect-vitals");
    setActiveActionId("collect-payment");
    if (editingExisting) {
      returnToEditSteps();
      return;
    }
    setCollectPaymentOpen(true);
  };

  const handlePaymentConfirmed = (payment) => {
    setPaymentDetails(payment);
    markCompleted("collect-payment");
    setActiveActionId("case-paper");
    if (editingExisting) {
      returnToEditSteps();
      return;
    }
    setCasePaperOpen(true);
  };

  const handleCasePaperConfirmed = (casePaper) => {
    setCasePaperDetails(casePaper);
    markCompleted("case-paper");
    if (editingExisting) {
      setActiveActionId(null);
      returnToEditSteps();
      return;
    }
    setActiveActionId(null);
  };

  const handleCloseEditSteps = () => {
    setEditStepsOpen(false);
    setEditingExisting(false);
  };

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page doctor-dashboard-page reception-dashboard-page">
        <Container fluid>
          <SummaryWidgets />
          <QuickActions
            onActionClick={handleActionClick}
            completedActionIds={completedActionIds}
            activeActionId={activeActionId}
            selectedPatient={selectedPatient}
            allottedSchedule={allottedSchedule}
            appointmentDetails={appointmentDetails}
            vitalsDetails={vitalsDetails}
            paymentDetails={paymentDetails}
            casePaperDetails={casePaperDetails}
          />
          <TodaysAppointments onEditAppointment={handleEditAppointment} />
        </Container>
      </div>

      <EditAppointmentStepsModal
        isOpen={editStepsOpen}
        toggle={handleCloseEditSteps}
        selectedPatient={selectedPatient}
        completedActionIds={completedActionIds}
        onSelectStep={handleSelectEditStep}
      />

      <PatientDetailsModal
        isOpen={patientDetailsOpen}
        toggle={() => setPatientDetailsOpen((open) => !open)}
        onPatientConfirmed={handlePatientConfirmed}
      />

      <ReceptionDoctorScheduleModal
        isOpen={doctorScheduleOpen}
        toggle={() => setDoctorScheduleOpen((open) => !open)}
        selectedPatient={selectedPatient}
        initialSchedule={editingExisting ? allottedSchedule : null}
        editMode={editingExisting}
        onScheduleConfirmed={handleScheduleConfirmed}
      />

      <BookAppointmentModal
        isOpen={bookAppointmentOpen}
        toggle={() => setBookAppointmentOpen((open) => !open)}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        initialAppointment={editingExisting ? appointmentDetails : null}
        editMode={editingExisting}
        onAppointmentConfirmed={handleAppointmentConfirmed}
      />

      <CollectVitalsModal
        isOpen={collectVitalsOpen}
        toggle={() => setCollectVitalsOpen((open) => !open)}
        selectedPatient={selectedPatient}
        initialVitals={vitalsDetails}
        editMode={editingExisting}
        onVitalsConfirmed={handleVitalsConfirmed}
      />

      <CollectPaymentModal
        isOpen={collectPaymentOpen}
        toggle={() => setCollectPaymentOpen((open) => !open)}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        consultationFee={consultationFee}
        initialPayment={editingExisting ? paymentDetails : null}
        editMode={editingExisting}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <CasePaperModal
        isOpen={casePaperOpen}
        toggle={() => setCasePaperOpen((open) => !open)}
        selectedPatient={selectedPatient}
        allottedSchedule={allottedSchedule}
        appointmentDetails={appointmentDetails}
        vitalsDetails={vitalsDetails}
        paymentDetails={paymentDetails}
        onCasePaperConfirmed={handleCasePaperConfirmed}
      />
    </React.Fragment>
  );
};

export default ReceptionDashboard;
