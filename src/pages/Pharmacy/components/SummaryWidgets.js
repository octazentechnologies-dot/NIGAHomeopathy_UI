import React from "react";
import { Card, CardBody, Col, Row } from "reactstrap";
import { Link } from "react-router-dom";

const WIDGETS = [
  {
    id: "orders",
    label: "Open Orders",
    icon: "ri-shopping-bag-3-line",
    linkPath: "/pharmacy/orders",
  },
  {
    id: "quotes",
    label: "Active Quotes",
    icon: "ri-file-list-3-line",
    linkPath: "/pharmacy/quotes",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "ri-archive-line",
    linkPath: "/pharmacy/inventory",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    icon: "ri-user-add-line",
    linkPath: "/pharmacy/onboarding",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: "ri-capsule-line",
    linkPath: "/pharmacy/prescriptions",
  },
];

const SummaryWidgets = () => (
  <Row className="g-2 pharmacy-dashboard-widgets">
    {WIDGETS.map((item) => (
      <Col xs={12} sm={6} lg className="pharmacy-kpi-col" key={item.id}>
        <Card className="card-animate admin-dash-card">
          <CardBody>
            <div className="d-flex align-items-center">
              <div className="flex-grow-1 overflow-hidden">
                <p className="text-uppercase fw-bold text-truncate mb-0 pharmacy-kpi-label">
                  {item.label}
                </p>
              </div>
              <div className="flex-shrink-0">
                <h5 className="fs-14 mb-0 text-muted">—</h5>
              </div>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-4">
              <div>
                <h4 className="fs-20 fw-semibold ff-secondary mb-4">
                  <span className="counter-value">-</span>
                </h4>
                <Link to={item.linkPath} className="pharmacy-kpi-link">
                  Coming Soon
                </Link>
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
    ))}
  </Row>
);

export default SummaryWidgets;
