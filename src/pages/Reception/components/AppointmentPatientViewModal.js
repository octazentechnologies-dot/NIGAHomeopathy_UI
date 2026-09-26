import React, { useEffect, useState } from "react";
import classnames from "classnames";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const DetailField = ({ label, value }) => (
  <div className="reception-view-detail-field">
    <span className="label">{label}</span>
    <strong>{value || "—"}</strong>
  </div>
);

const statusBadgeClass = (status) => {
  if (status === "Paid" || status === "Completed") return "bg-success-subtle text-success";
  if (status === "Waiting") return "bg-warning-subtle text-warning";
  if (status === "Unpaid") return "bg-danger-subtle text-danger";
  return "bg-secondary-subtle text-secondary";
};

const AppointmentPatientViewModal = ({ isOpen, toggle, appointment }) => {
  const [activeTab, setActiveTab] = useState("1");

  useEffect(() => {
    if (isOpen) setActiveTab("1");
  }, [isOpen, appointment?.id]);

  if (!appointment) return null;

  const patient = appointment.patientDetails || {};
  const vitals = appointment.vitals || {};
  const payment = appointment.paymentDetails || {};

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      toggle={toggle}
      className="patient-list-modal reception-appointment-view-modal reception-patient-details-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i
            className="ri-user-heart-line"
            style={{ color: "#25a0e2", fontSize: 15 }}
            aria-hidden="true"
          />
          <span>
            <span className="patient-list-modal__title-text d-block">
              {appointment.patient || "Patient Details"}
            </span>
            <span className="reception-payment-subtitle">
              {appointment.time || "—"}
              {appointment.doctor ? ` · ${appointment.doctor}` : ""}
            </span>
          </span>
        </span>
      </ModalHeader>

      <ModalBody>
        <div className="doctor-patient-nav-tabs mb-3">
          <Nav pills className="nav-customs doctor-patient-custom-nav reception-patient-details-tabs mb-0">
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                className={classnames({ active: activeTab === "1" })}
                onClick={() => setActiveTab("1")}
              >
                <span className="doctor-patient-tab-label">Patient</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                className={classnames({ active: activeTab === "2" })}
                onClick={() => setActiveTab("2")}
              >
                <span className="doctor-patient-tab-label">Appointment</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                className={classnames({ active: activeTab === "3" })}
                onClick={() => setActiveTab("3")}
              >
                <span className="doctor-patient-tab-label">Vitals</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                className={classnames({ active: activeTab === "4" })}
                onClick={() => setActiveTab("4")}
              >
                <span className="doctor-patient-tab-label">Payment</span>
              </NavLink>
            </NavItem>
          </Nav>
        </div>

        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            <div className="reception-view-detail-grid">
              <DetailField label="Full Name" value={patient.fullName || appointment.patient} />
              <DetailField label="Age / Sex" value={patient.ageSex} />
              <DetailField label="Mobile" value={patient.mobile} />
              <DetailField label="Email" value={patient.email} />
              <DetailField label="Date of Birth" value={patient.dateOfBirth} />
              <DetailField label="Blood Group" value={patient.bloodGroup} />
              <DetailField label="Address" value={patient.address} />
              <DetailField label="City / Place" value={patient.place} />
              <DetailField label="Emergency Contact" value={patient.emergencyContact} />
              <DetailField label="Patient ID" value={patient.patientId} />
            </div>
          </TabPane>

          <TabPane tabId="2">
            <div className="reception-view-detail-grid">
              <DetailField label="Date" value={appointment.dateDisplay} />
              <DetailField label="Time" value={appointment.time} />
              <DetailField label="Doctor" value={appointment.doctor} />
              <DetailField label="Type" value={appointment.type} />
              <DetailField label="Severity" value={appointment.severity} />
              <DetailField label="Duration" value={appointment.duration} />
              <DetailField label="Chief Complaints" value={appointment.chiefComplaints} />
              <DetailField label="Appointment Status" value={appointment.appointmentStatus} />
            </div>
          </TabPane>

          <TabPane tabId="3">
            <div className="reception-view-detail-grid">
              <DetailField label="Blood Pressure" value={vitals.bloodPressure} />
              <DetailField label="Pulse" value={vitals.pulse} />
              <DetailField label="Temperature" value={vitals.temperature} />
              <DetailField label="Weight" value={vitals.weight} />
              <DetailField label="Height" value={vitals.height} />
              <DetailField label="SpO2" value={vitals.spo2} />
              <DetailField label="Respiratory Rate" value={vitals.respiratoryRate} />
              <DetailField label="Blood Sugar" value={vitals.bloodSugar} />
              <DetailField label="Notes" value={vitals.notes} />
            </div>
          </TabPane>

          <TabPane tabId="4">
            <div className="reception-view-detail-grid">
              <DetailField label="Consultation Fee" value={appointment.payment} />
              <DetailField label="Amount Paid" value={payment.amount} />
              <DetailField label="GST / Tax" value={payment.gst} />
              <DetailField label="Total" value={payment.total || appointment.payment} />
              <DetailField label="Method" value={payment.method} />
              <div className="reception-view-detail-field">
                <span className="label">Payment Status</span>
                <strong>
                  <span className={`badge ${statusBadgeClass(appointment.status)}`}>
                    {appointment.status || "—"}
                  </span>
                </strong>
              </div>
              <DetailField label="Notes" value={payment.notes} />
            </div>
          </TabPane>
        </TabContent>
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer">
        <ModalActionButton action="close" type="button" onClick={toggle}>
          Close
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default AppointmentPatientViewModal;
