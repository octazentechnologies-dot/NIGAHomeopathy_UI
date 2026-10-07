import React from "react";
import { Card, CardBody, Col, Row, Spinner } from "reactstrap";
import { Link } from "react-router-dom";

const WIDGETS = [
  {
    id: "ledger",
    label: "Collected (30 days)",
    icon: "ri-book-2-line",
    linkPath: "/account/ledger",
    cta: "Open ledger",
  },
  {
    id: "earnings",
    label: "Doctor Earnings",
    icon: "ri-user-smile-line",
    linkPath: "/account/doctor-earnings",
    cta: "Open earnings",
  },
  {
    id: "payouts",
    label: "Pending Payouts",
    icon: "ri-exchange-dollar-line",
    linkPath: "/account/payouts",
    cta: "Open payouts",
  },
  {
    id: "refunds",
    label: "Refunds",
    icon: "ri-file-list-3-line",
    linkPath: "/account/refunds",
    cta: "Open refunds",
  },
  {
    id: "tax",
    label: "GST (30 days)",
    icon: "ri-percent-line",
    linkPath: "/account/tax",
    cta: "Open GST",
  },
  {
    id: "exceptions",
    label: "Open Exceptions",
    icon: "ri-error-warning-line",
    linkPath: "/account/exceptions",
    cta: "Open exceptions",
  },
];

const SummaryWidgets = ({ values = {}, loading = false }) => (
  <Row className="g-2 account-dashboard-widgets">
    {WIDGETS.map((item) => {
      const value = values[item.id] || {};
      return (
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
                  <h5 className="fs-14 mb-0 text-muted">{value.sub || ""}</h5>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-20 fw-semibold ff-secondary mb-4">
                    {loading ? <Spinner size="sm" /> : <span className="counter-value">{value.main ?? "—"}</span>}
                  </h4>
                  <Link to={item.linkPath} className="account-kpi-link">
                    {item.cta}
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
      );
    })}
  </Row>
);

export default SummaryWidgets;
