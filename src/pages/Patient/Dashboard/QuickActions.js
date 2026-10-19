import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardBody, Col, Row } from "reactstrap";

const ACTIONS = [
  { id: "book", label: "Book Doctor", icon: "mdi mdi-calendar-plus", to: "/family" },
  { id: "family", label: "Family", icon: "mdi mdi-account-group", to: "/family" },
  { id: "checkin", label: "Check In", icon: "mdi mdi-checkbox-marked-circle-outline", to: "/patient/check-in" },
  { id: "prescriptions", label: "Prescriptions", icon: "mdi mdi-file-document-outline", to: "/patient/prescriptions" },
  { id: "medicine", label: "Medicine Orders", icon: "mdi mdi-capsule", to: "/patient/medicine-orders" },
  { id: "support", label: "Support", icon: "mdi mdi-headset", to: "/patient/support" },
];

const QuickActions = () => {
  const { pathname } = useLocation();
  return (
  <Row className="g-2 mt-1 patient-quick-actions">
    <Col xs={12}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <h5 className="patient-section-title mb-0">Quick Actions</h5>
      </div>
    </Col>
    {ACTIONS.map((action) => {
      const active = pathname === action.to;
      return (
        <Col xs={6} sm={4} lg={2} key={action.id}>
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
                <div className="avatar-sm mx-auto mb-2">
                  <span className="avatar-title doctor-action-icon rounded fs-3 bg-info-subtle border border-info border-opacity-25">
                    <i className={`text-info ${action.icon}`} />
                  </span>
                </div>
                <p className="mb-0 patient-action-label text-truncate">{action.label}</p>
              </CardBody>
            </Card>
          </Link>
        </Col>
      );
    })}
  </Row>
  );
};

export default QuickActions;
