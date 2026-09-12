import React from "react";
import { Card, CardBody, Col, Row } from "reactstrap";
import { Link } from "react-router-dom";

const WIDGETS = [
  {
    id: "ledger",
    label: "Total Ledger",
    icon: "ri-book-2-line",
    linkPath: "/account/ledger",
  },
  {
    id: "earnings",
    label: "Doctor Earnings",
    icon: "ri-user-smile-line",
    linkPath: "/account/doctor-earnings",
  },
  {
    id: "payouts",
    label: "Payouts",
    icon: "ri-exchange-dollar-line",
    linkPath: "/account/payouts",
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: "ri-file-list-3-line",
    linkPath: "/account/invoices",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "ri-bar-chart-box-line",
    linkPath: "/account/reports",
  },
];

const SummaryWidgets = () => (
  <Row className="g-2 account-dashboard-widgets">
    {WIDGETS.map((item) => (
      <Col xs={12} sm={6} lg className="account-kpi-col" key={item.id}>
        <Card className="card-animate admin-dash-card">
          <CardBody>
            <div className="d-flex align-items-center">
              <div className="flex-grow-1 overflow-hidden">
                <p className="text-uppercase fw-bold text-truncate mb-0 account-kpi-label">
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
                <Link to={item.linkPath} className="account-kpi-link">
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
