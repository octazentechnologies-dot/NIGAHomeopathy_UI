import React from "react";
import CountUp from "react-countup";
import { Card, CardBody, Col, Spinner } from "reactstrap";
import { percentChange } from "./adminDashboardFormat";

const compactRupees = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 1e7) return { end: amount / 1e7, suffix: "Cr", decimals: 2 };
  if (amount >= 1e5) return { end: amount / 1e5, suffix: "L", decimals: 2 };
  if (amount >= 1e3) return { end: amount / 1e3, suffix: "K", decimals: 1 };
  return { end: amount, suffix: "", decimals: 0 };
};

const buildCards = (kpis) => {
  const revenue = compactRupees(kpis.revenue);
  return [
    {
      label: "Appointments",
      end: kpis.appointments,
      change: percentChange(kpis.appointments, kpis.prevAppointments),
      note: `${kpis.completed} completed · ${kpis.cancelled} cancelled`,
      icon: "ri-calendar-check-line",
    },
    {
      label: "Revenue collected",
      prefix: "₹",
      ...revenue,
      change: percentChange(kpis.revenue, kpis.prevRevenue),
      note: `Consult ₹${Number(kpis.consultRevenue || 0).toLocaleString("en-IN")} · Medicine ₹${Number(kpis.medicineRevenue || 0).toLocaleString("en-IN")}`,
      icon: "ri-wallet-3-line",
    },
    {
      label: "New patients",
      end: kpis.newPatients,
      change: percentChange(kpis.newPatients, kpis.prevNewPatients),
      note: `${Number(kpis.patients || 0).toLocaleString("en-IN")} patients in total`,
      icon: "ri-user-add-line",
    },
    {
      label: "Doctors",
      end: kpis.doctors,
      change: undefined,
      note: `${kpis.verifiedDoctors ?? 0} verified · ${kpis.medicineOrders} medicine orders`,
      icon: "ri-stethoscope-line",
    },
  ];
};

const ChangeBadge = ({ change }) => {
  if (change === undefined) return null;
  if (change === null) return <h5 className="fs-14 mb-0 text-muted">New</h5>;
  const tone = change > 0 ? "success" : change < 0 ? "danger" : "muted";
  const icon = change > 0 ? "ri-arrow-right-up-line" : change < 0 ? "ri-arrow-right-down-line" : "";
  return (
    <h5 className={`fs-14 mb-0 text-${tone}`} title="Change vs previous period">
      {icon ? <i className={`fs-13 align-middle ${icon}`} /> : null} {change > 0 ? "+" : ""}
      {change}%
    </h5>
  );
};

const Widgets = ({ summary, loading }) => {
  const kpis = summary?.kpis;
  if (!kpis) {
    return (
      <Col xs={12}>
        <Card className="admin-dash-card">
          <CardBody className="text-muted d-flex align-items-center gap-2">
            {loading ? <Spinner size="sm" /> : null}
            {loading ? "Loading platform figures…" : "Platform figures are not available."}
          </CardBody>
        </Card>
      </Col>
    );
  }

  return (
    <React.Fragment>
      {buildCards(kpis).map((item) => (
        <Col xl={3} md={6} key={item.label}>
          <Card className="card-animate admin-dash-card">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">{item.label}</p>
                </div>
                <div className="flex-shrink-0">
                  <ChangeBadge change={item.change} />
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-20 fw-semibold ff-secondary mb-4">
                    <CountUp
                      start={0}
                      prefix={item.prefix || ""}
                      suffix={item.suffix || ""}
                      separator=","
                      end={Number(item.end) || 0}
                      decimals={item.decimals || 0}
                      duration={2}
                    />
                  </h4>
                  <span className="text-muted">{item.note}</span>
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
    </React.Fragment>
  );
};

export default Widgets;
