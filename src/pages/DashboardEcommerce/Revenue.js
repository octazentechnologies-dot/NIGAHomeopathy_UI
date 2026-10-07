import React from "react";
import { Card, CardBody, CardHeader, Col, Row, Spinner } from "reactstrap";
import CountUp from "react-countup";
import { VisitTrendChart } from "./DashboardEcommerceCharts";
import { formatRupees } from "./adminDashboardFormat";

const Revenue = ({ summary, loading }) => {
  const kpis = summary?.kpis;
  const trend = summary?.trend || [];
  const headline = [
    { label: "Appointments", value: <CountUp start={0} end={kpis?.appointments || 0} duration={2} separator="," /> },
    { label: "Revenue", value: formatRupees(kpis?.revenue) },
    { label: "New Patients", value: <CountUp start={0} end={kpis?.newPatients || 0} duration={2} separator="," /> },
    {
      label: "Follow-up Rate",
      value: <CountUp start={0} end={Number(kpis?.followUpRate) || 0} decimals={1} duration={2} suffix="%" />,
      className: "text-success",
    },
  ];

  return (
    <Card className="admin-dash-card">
      <CardHeader className="border-0 align-items-center d-flex admin-dash-card-header">
        <h4 className="card-title mb-0 flex-grow-1">Patient Visits</h4>
        <span className="text-muted small">
          {summary?.trendGranularity === "month" ? "Monthly" : "Daily"} · selected period
        </span>
      </CardHeader>

      <CardHeader className="p-0 border-0 bg-light-subtle">
        <Row className="g-0 text-center">
          {headline.map((item, index) => (
            <Col xs={6} sm={3} key={item.label}>
              <div className={`p-3 border border-dashed border-start-0${index === headline.length - 1 ? " border-end-0" : ""}`}>
                <h5 className={`mb-1 ${item.className || ""}`}>{kpis ? item.value : "—"}</h5>
                <p className="text-muted mb-0">{item.label}</p>
              </div>
            </Col>
          ))}
        </Row>
      </CardHeader>

      <CardBody className="p-0 pb-2">
        {loading && !summary ? (
          <div className="d-flex align-items-center justify-content-center gap-2 text-muted" style={{ height: 370 }}>
            <Spinner size="sm" /> Loading visits…
          </div>
        ) : (
          <div className="w-100" dir="ltr">
            <VisitTrendChart trend={trend} dataColors='["--vz-info", "--vz-primary", "--vz-secondary"]' />
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Revenue;
