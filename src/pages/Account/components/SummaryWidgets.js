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
        <Col xs={12} sm={6} lg={4} xl={2} className="account-kpi-col" key={item.id}>
          <Link to={item.linkPath} className="account-kpi-card-link">
            <Card className="card-animate admin-dash-card account-kpi-card mb-2">
              <CardBody className="d-flex gap-3 align-items-center">
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-3">
                    <i className={`text-info ${item.icon}`} />
                  </span>
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <h5 className="fs-15 mb-0 account-kpi-count">
                    {loading ? <Spinner size="sm" /> : (value.main ?? "—")}
                  </h5>
                  <p className="mb-0 text-muted text-uppercase account-kpi-label">{item.label}</p>
                  {value.sub ? <p className="mb-0 text-muted small text-truncate">{value.sub}</p> : null}
                </div>
              </CardBody>
            </Card>
          </Link>
        </Col>
      );
    })}
  </Row>
);

export default SummaryWidgets;
