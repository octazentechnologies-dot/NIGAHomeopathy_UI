import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardBody, Col, Row } from "reactstrap";

const ACTIONS = [
  { id: "book", label: "Book Doctor", icon: "ri-calendar-event-line", to: "/family" },
  { id: "family", label: "Family", icon: "ri-group-line", to: "/family" },
  { id: "checkin", label: "Check In", icon: "ri-checkbox-circle-line", to: "/patient/check-in" },
  { id: "prescriptions", label: "Prescriptions", icon: "ri-file-list-3-line", to: "/patient/prescriptions" },
  { id: "medicine", label: "Medicine Orders", icon: "ri-capsule-line", to: "/patient/medicine-orders" },
  { id: "support", label: "Support", icon: "ri-customer-service-2-line", to: "/patient/support" },
];

const QuickActions = () => {
  const { pathname } = useLocation();
  return (
  <div className="patient-quick-actions-wrap mt-2">
    <h5 className="patient-section-title patient-quick-actions-title mb-2">
      <i className="ri-apps-2-line" aria-hidden="true" />
      Quick Actions
    </h5>
    <Row className="g-2 patient-quick-actions">
    {ACTIONS.map((action) => {
      const active = pathname === action.to;
      return (
        <Col xs={6} sm={4} lg={2} className="patient-action-col" key={action.id}>
          <Link
            to={action.to}
            className="text-decoration-none patient-quick-action-btn d-block"
            aria-label={action.label}
          >
            <Card
              className={`card-animate admin-dash-card doctor-action-card patient-quick-action-card h-100 mb-0${
                active ? " is-active-step" : ""
              }`}
            >
              <CardBody className="text-center py-3 px-2">
                <i className={`${action.icon} patient-quick-action-icon`} aria-hidden="true" />
                <p className="mb-0 patient-action-label text-truncate">{action.label}</p>
              </CardBody>
            </Card>
          </Link>
        </Col>
      );
    })}
    </Row>
  </div>
  );
};

export default QuickActions;
