import React from "react";
import { Card, CardBody, Col, Row, Spinner } from "reactstrap";
import { Link } from "react-router-dom";

const WIDGETS = [
  {
    id: "ledger",
    label: "Collected (30 days)",
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
    label: "Pending Payouts",
    icon: "ri-exchange-dollar-line",
    linkPath: "/account/payouts",
  },
  {
    id: "refunds",
    label: "Refunds",
    icon: "ri-file-list-3-line",
    linkPath: "/account/refunds",
  },
  {
    id: "tax",
    label: "GST (30 days)",
    icon: "ri-percent-line",
    linkPath: "/account/tax",
  },
  {
    id: "exceptions",
    label: "Open Exceptions",
    icon: "ri-error-warning-line",
    linkPath: "/account/exceptions",
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
                  <Link
                    to={item.linkPath}
                    className="account-kpi-view"
                    title="View all"
                    aria-label={`View all ${item.label}`}
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
