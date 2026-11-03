import React from "react";
import { Card, CardBody, Col, Row } from "reactstrap";
import { Link } from "react-router-dom";

const WIDGETS = [
  {
    id: "orders",
    label: "Open Orders",
    icon: "ri-shopping-bag-3-line",
    linkPath: "/pharmacy/orders",
    linkLabel: "View orders",
  },
  {
    id: "quotes",
    label: "Active Quotes",
    icon: "ri-file-list-3-line",
    linkPath: "/pharmacy/quotes",
    linkLabel: "View quotes",
  },
  {
    id: "inventory",
    label: "Stock confirmation",
    icon: "ri-archive-line",
    linkPath: "/pharmacy/inventory",
    linkLabel: "Confirm stock",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    icon: "ri-user-add-line",
    linkPath: "/pharmacy/onboarding",
    linkLabel: "View details",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: "ri-capsule-line",
    linkPath: "/pharmacy/prescriptions",
    linkLabel: "View prescriptions",
  },
];

/** `values` maps widget id → display value; widgets without a value stay "Coming Soon". */
const SummaryWidgets = ({ values = {} }) => (
  <Row className="g-2 pharmacy-dashboard-widgets">
    {WIDGETS.map((item) => {
      const value = values[item.id];
      const live = value != null && item.linkLabel;
      return (
        <Col xs={12} sm={6} lg className="pharmacy-kpi-col" key={item.id}>
          <Card className="card-animate admin-dash-card admin-kpi-card pharmacy-kpi-card mb-0 h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-bold text-truncate mb-0 pharmacy-kpi-label">
                    {item.label}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-3">
                <div className="overflow-hidden pe-2">
                  <h4 className="fs-20 fw-semibold ff-secondary mb-2 pharmacy-kpi-count">
                    <span className="counter-value">{live ? value : "-"}</span>
                  </h4>
                  <Link
                    to={item.linkPath}
                    className="pharmacy-kpi-view"
                    title="View"
                    aria-label={`View ${item.label}`}
                  >
                    <i className="ri-eye-line" aria-hidden="true" />
                  </Link>
                </div>
                <i className={`${item.icon} kpi-tile-icon`} aria-hidden="true" />
              </div>
            </CardBody>
          </Card>
        </Col>
      );
    })}
  </Row>
);

export default SummaryWidgets;
