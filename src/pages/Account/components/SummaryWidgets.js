import React from "react";
import { Card, CardBody, Col, Row, Spinner } from "reactstrap";
import { Link } from "react-router-dom";

const WIDGETS = [
  {
    id: "ledger",
    label: "Collected (30 days)",
    icon: "ri-book-2-line",
    linkPath: "/account/ledger",
    cta: "View All",
  },
  {
    id: "earnings",
    label: "Doctor Earnings",
    icon: "ri-user-smile-line",
    linkPath: "/account/doctor-earnings",
    cta: "View All",
  },
  {
    id: "payouts",
    label: "Pending Payouts",
    icon: "ri-exchange-dollar-line",
    linkPath: "/account/payouts",
    cta: "View All",
  },
  {
    id: "refunds",
    label: "Refunds",
    icon: "ri-file-list-3-line",
    linkPath: "/account/refunds",
    cta: "View All",
  },
  {
    id: "tax",
    label: "GST (30 days)",
    icon: "ri-percent-line",
    linkPath: "/account/tax",
    cta: "View All",
  },
  {
    id: "exceptions",
    label: "Open Exceptions",
    icon: "ri-error-warning-line",
    linkPath: "/account/exceptions",
    cta: "View All",
  },
];

/** KPI cards — same layout as Reception dashboard (title, value, View All, icon). */
const SummaryWidgets = ({ values = {}, loading = false }) => (
  <Row className="g-2 account-dashboard-widgets">
    {WIDGETS.map((item) => {
      const value = values[item.id] || {};
      return (
        <Col xs={12} sm={6} lg={4} xl={2} className="account-kpi-col" key={item.id}>
          <Card className="card-animate admin-dash-card doctor-action-card account-kpi-card mb-0 h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-bold text-truncate mb-0 account-kpi-label">
                    {item.label}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-3">
                <div className="overflow-hidden pe-2">
                  <h4 className="fs-20 fw-semibold ff-secondary mb-2 account-kpi-count">
                    {loading ? <Spinner size="sm" /> : (value.main ?? "—")}
                  </h4>
                  {value.sub ? (
                    <p className="mb-2 text-muted small text-truncate account-kpi-sub">{value.sub}</p>
                  ) : (
                    <p className="mb-2 text-muted small">&nbsp;</p>
                  )}
                  <Link to={item.linkPath} className="account-kpi-link doctor-dashboard-action-link">
                    {item.cta}
                  </Link>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title rounded fs-3 doctor-action-icon">
                    <i className={item.icon} aria-hidden="true" />
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
