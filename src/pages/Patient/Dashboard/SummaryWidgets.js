import React from "react";
import CountUp from "react-countup";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Row } from "reactstrap";

const KPI_CARDS = [
  {
    id: "today",
    label: "Today's Appointments",
    icon: "ri-calendar-check-line",
    linkPath: "#patient-appointments",
  },
  {
    id: "upcoming",
    label: "Upcoming Visits",
    icon: "ri-calendar-line",
    linkPath: "#patient-appointments",
  },
  {
    id: "payments",
    label: "Pending Payments",
    icon: "ri-wallet-3-line",
    linkPath: "/patient/medicine-orders",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: "ri-file-list-3-line",
    linkPath: "/patient/prescriptions",
  },
  {
    id: "medicines",
    label: "Medicine Orders",
    icon: "ri-capsule-line",
    linkPath: "/patient/medicine-orders",
  },
];

const SummaryWidgets = ({ values = {}, onTodayClick }) => (
  <Row className="g-2 patient-dashboard-widgets">
    {KPI_CARDS.map((item) => {
      const value = values[item.id];
      const live = value != null;
      const isHash = String(item.linkPath || "").startsWith("#");
      return (
        <Col xs={12} sm={6} lg className="patient-kpi-col" key={item.id}>
          <Card className="card-animate admin-dash-card doctor-action-card doctor-kpi-card h-100 mb-0">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-bold text-truncate mb-0 patient-kpi-label">{item.label}</p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-20 fw-semibold ff-secondary mb-4">
                    <span className="counter-value">
                      {live ? <CountUp start={0} end={Number(value) || 0} duration={1.2} /> : "—"}
                    </span>
                  </h4>
                  {isHash ? (
                    <button
                      type="button"
                      className="patient-kpi-view"
                      title="View all"
                      aria-label={`View all ${item.label}`}
                      onClick={() => {
                        onTodayClick?.();
                        document.getElementById("patient-appointments")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <i className="ri-eye-line" aria-hidden="true" />
                    </button>
                  ) : (
                    <Link to={item.linkPath} className="patient-kpi-view" title="View all" aria-label={`View all ${item.label}`}>
                      <i className="ri-eye-line" aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <i className={`${item.icon} patient-kpi-icon`} aria-hidden="true" />
              </div>
            </CardBody>
          </Card>
        </Col>
      );
    })}
  </Row>
);

export default SummaryWidgets;
