import React from "react";
import CountUp from "react-countup";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Row } from "reactstrap";

const KPI_CARDS = [
  {
    id: "today",
    label: "Today's Appointments",
    icon: "mdi mdi-calendar-clock",
    linkPath: "#patient-appointments",
    linkLabel: "View All",
  },
  {
    id: "upcoming",
    label: "Upcoming Visits",
    icon: "mdi mdi-calendar-month",
    linkPath: "#patient-appointments",
    linkLabel: "View All",
  },
  {
    id: "payments",
    label: "Pending Payments",
    icon: "mdi mdi-cash-multiple",
    linkPath: "/patient/medicine-orders",
    linkLabel: "View All",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: "mdi mdi-file-document-outline",
    linkPath: "/patient/prescriptions",
    linkLabel: "View All",
  },
  {
    id: "medicines",
    label: "Medicine Orders",
    icon: "mdi mdi-capsule",
    linkPath: "/patient/medicine-orders",
    linkLabel: "View All",
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
                      className="btn btn-link p-0 patient-kpi-link"
                      onClick={() => {
                        onTodayClick?.();
                        document.getElementById("patient-appointments")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {item.linkLabel}
                    </button>
                  ) : (
                    <Link to={item.linkPath} className="patient-kpi-link">
                      {item.linkLabel}
                    </Link>
                  )}
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title rounded fs-3 bg-info-subtle border border-info border-opacity-25">
                    <i className={`text-info ${item.icon}`} />
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      );
    })}
  </Row>
);

export default SummaryWidgets;
