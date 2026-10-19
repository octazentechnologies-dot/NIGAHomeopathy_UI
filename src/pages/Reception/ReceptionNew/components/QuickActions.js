import React from "react";
import { Card, CardBody, Col, Row } from "reactstrap";

const ACTIONS = [
  {
    id: "patient-details",
    label: "Patient Details",
    icon: "mdi mdi-account-details",
  },
  {
    id: "doctor-schedule",
    label: "Doctor Schedule",
    icon: "mdi mdi-calendar-month",
  },
  {
    id: "new-appointment",
    label: "Book Appointment",
    icon: "mdi mdi-calendar-plus",
  },
  {
    id: "collect-vitals",
    label: "Collect Vitals",
    icon: "mdi mdi-heart-pulse",
  },
  {
    id: "collect-payment",
    label: "Collect Payment",
    icon: "mdi mdi-cash-check",
  },
  {
    id: "case-paper",
    label: "Case Paper",
    icon: "mdi mdi-file-document-outline",
  },
];

const QuickActions = ({
  onActionClick,
  completedActionIds = [],
  activeActionId = null,
  selectedPatient = null,
  allottedSchedule = null,
  appointmentDetails = null,
  vitalsDetails = null,
  paymentDetails = null,
  casePaperDetails = null,
}) => (
  <Row className="g-2 mt-1 reception-quick-actions">
    <Col xs={12}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <h5 className="reception-section-title mb-0">Quick Actions</h5>
        <div className="d-flex align-items-center flex-wrap gap-2">
          {selectedPatient?.fullName ? (
            <div className="reception-selected-patient-chip">
              <i className="ri-user-heart-line" aria-hidden="true" />
              <span>
                {selectedPatient.fullName}
                {selectedPatient.age || selectedPatient.sex
                  ? ` · ${selectedPatient.age || "—"} / ${selectedPatient.sex || "—"}`
                  : ""}
              </span>
            </div>
          ) : null}
          {allottedSchedule?.doctor?.label && allottedSchedule?.slot?.label ? (
            <div className="reception-selected-patient-chip reception-allotted-schedule-chip">
              <i className="ri-calendar-check-line" aria-hidden="true" />
              <span>
                {allottedSchedule.doctor.label} · {allottedSchedule.dateDisplay} ·{" "}
                {allottedSchedule.slot.label}
              </span>
            </div>
          ) : null}
          {appointmentDetails?.chiefComplaints ? (
            <div className="reception-selected-patient-chip reception-appointment-chip">
              <i className="ri-file-list-3-line" aria-hidden="true" />
              <span>
                {appointmentDetails.severityLabel || appointmentDetails.severity}
                {appointmentDetails.duration ? ` · ${appointmentDetails.duration}` : ""}
              </span>
            </div>
          ) : null}
          {vitalsDetails?.bloodPressure ? (
            <div className="reception-selected-patient-chip reception-vitals-chip">
              <i className="ri-heart-pulse-line" aria-hidden="true" />
              <span>
                BP {vitalsDetails.bloodPressure}
                {vitalsDetails.pulse ? ` · Pulse ${vitalsDetails.pulse}` : ""}
              </span>
            </div>
          ) : null}
          {paymentDetails?.paymentStatus ? (
            <div className="reception-selected-patient-chip reception-payment-chip">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <span>
                {paymentDetails.paymentStatus}
                {paymentDetails.total != null ? ` · ₹ ${paymentDetails.total}` : ""}
              </span>
            </div>
          ) : null}
          {casePaperDetails?.casePaperNo ? (
            <div className="reception-selected-patient-chip reception-case-paper-chip">
              <i className="ri-file-paper-2-line" aria-hidden="true" />
              <span>{casePaperDetails.casePaperNo}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Col>
    {ACTIONS.map((action) => {
      const isCompleted = completedActionIds.includes(action.id);
      const isActive = activeActionId === action.id;
      return (
        <Col xs={6} sm={4} lg key={action.id} className="reception-action-col">
          <Card
            className={`card-animate admin-dash-card doctor-action-card mb-0 h-100 reception-quick-action-card${
              isCompleted ? " is-completed" : ""
            }${isActive ? " is-active-step" : ""}`}
          >
            <CardBody className="text-center py-3">
              <button
                type="button"
                className="reception-quick-action-btn text-decoration-none d-block w-100 border-0 bg-transparent p-0"
                onClick={() => onActionClick?.(action.id)}
              >
                <div className="avatar-sm mx-auto mb-2">
                  <span className="avatar-title rounded fs-3 doctor-action-icon">
                    <i className={action.icon} aria-hidden="true" />
                  </span>
                </div>
                <p className="mb-0 fw-semibold reception-action-label">{action.label}</p>
              </button>
            </CardBody>
          </Card>
        </Col>
      );
    })}
  </Row>
);

export default QuickActions;
export { ACTIONS as RECEPTION_QUICK_ACTIONS };
