import React from "react";
import ReactApexChart from "react-apexcharts";
import { Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import getChartColorsArray from "../../../Components/Common/ChartsDynamicColor";

const formatRupees = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹ 0";
  return `₹ ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

/** Sample finance figures so charts always render on Account dashboard. */
const DUMMY = {
  collected: 185000,
  earnings: 112000,
  pendingPayouts: 42000,
  refunds: 8500,
  gstTotal: 33300,
  openExceptions: 4,
  pendingPayoutCount: 7,
  payoutCount: 18,
  weeklyCollected: [22000, 28000, 19500, 31000, 26500, 34000, 24000],
  weeklyLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const FinanceBarChart = ({ series, categories, dataColors }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    chart: { type: "bar", height: 320, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { columnWidth: "42%", borderRadius: 4, distributed: true } },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors,
    xaxis: {
      categories,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: { formatter: (y) => formatRupees(y), style: { fontSize: "11px" } },
    },
    grid: {
      borderColor: "#f1f5f9",
      xaxis: { lines: { show: false } },
      padding: { top: 0, right: 8, bottom: 0, left: 4 },
    },
    tooltip: { y: { formatter: (y) => formatRupees(y) } },
  };
  return (
    <ReactApexChart dir="ltr" options={options} series={series} type="bar" height={320} className="apex-charts" />
  );
};

const WeeklyAreaBarChart = ({ labels, collected, dataColors }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    chart: { height: 300, type: "line", toolbar: { show: false }, fontFamily: "inherit" },
    stroke: { curve: "smooth", width: [0, 2.5] },
    fill: { opacity: [0.85, 0.15] },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 3 } },
    markers: { size: 0, hover: { size: 4 } },
    colors,
    xaxis: {
      categories: labels,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: { formatter: (y) => formatRupees(y), style: { fontSize: "11px" } },
    },
    grid: {
      borderColor: "#f1f5f9",
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    legend: { show: true, position: "bottom", fontSize: "12px" },
    tooltip: { shared: true, y: { formatter: (y) => formatRupees(y) } },
  };
  const series = [
    { name: "Collected", type: "bar", data: collected },
    { name: "Trend", type: "area", data: collected },
  ];
  return (
    <ReactApexChart dir="ltr" options={options} series={series} type="line" height={300} className="apex-charts" />
  );
};

const FinanceDonutChart = ({ labels, values, dataColors, centerLabel = "Total" }) => {
  const colors = getChartColorsArray(dataColors);
  const total = values.reduce((sum, n) => sum + (Number(n) || 0), 0);
  const options = {
    labels,
    chart: { type: "donut", height: 300, fontFamily: "inherit" },
    legend: { position: "bottom", fontSize: "12px" },
    stroke: { show: false },
    dataLabels: { dropShadow: { enabled: false } },
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: { show: true, offsetY: 16, fontSize: "11px", color: "#64748b" },
            value: {
              show: true,
              offsetY: -12,
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
              formatter: (val) => formatRupees(val),
            },
            total: {
              show: true,
              showAlways: true,
              label: centerLabel,
              fontSize: "11px",
              color: "#64748b",
              formatter: () => formatRupees(total),
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (y) => formatRupees(y) } },
  };
  return (
    <ReactApexChart dir="ltr" options={options} series={values} type="donut" height={300} className="apex-charts" />
  );
};

const FinancePieChart = ({ labels, values, dataColors }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    labels,
    chart: { type: "pie", height: 300, fontFamily: "inherit" },
    legend: { position: "bottom", fontSize: "12px" },
    stroke: { width: 0 },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(val)}%`,
      style: { fontSize: "11px" },
      dropShadow: { enabled: false },
    },
    colors,
    tooltip: {
      y: { formatter: (y) => (Number.isFinite(y) ? String(Math.round(y)) : y) },
    },
  };
  return (
    <ReactApexChart dir="ltr" options={options} series={values} type="pie" height={300} className="apex-charts" />
  );
};

/**
 * Account dashboard charts with dummy sample data (always draws).
 * Admin-style ApexCharts: bar, donut, pie, and weekly combo.
 */
const AccountCharts = () => {
  const barCategories = ["Collected", "Earnings", "Payouts", "Refunds", "GST"];
  const barValues = [DUMMY.collected, DUMMY.earnings, DUMMY.pendingPayouts, DUMMY.refunds, DUMMY.gstTotal];
  const donutLabels = ["Collected", "Pending payouts", "Refunds", "GST"];
  const donutValues = [DUMMY.collected, DUMMY.pendingPayouts, DUMMY.refunds, DUMMY.gstTotal];
  const pieLabels = ["Pending payouts", "Paid / other", "Open exceptions"];
  const pieValues = [
    DUMMY.pendingPayoutCount,
    Math.max(0, DUMMY.payoutCount - DUMMY.pendingPayoutCount),
    DUMMY.openExceptions,
  ];

  return (
    <div className="account-charts mt-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <h5 className="account-section-title mb-0">Finance overview</h5>
        <span className="badge bg-soft-info text-info">Sample data</span>
      </div>
      <Row className="g-2">
        <Col xl={7}>
          <Card className="admin-dash-card account-chart-card mb-0 h-100">
            <CardHeader className="align-items-center d-flex admin-dash-card-header border-0">
              <h4 className="card-title mb-0 flex-grow-1">Money mix (30 days)</h4>
              <span className="text-muted small">Bar chart</span>
            </CardHeader>
            <CardBody className="pt-0">
              <FinanceBarChart
                categories={barCategories}
                series={[{ name: "Amount", data: barValues }]}
                dataColors='["--vz-info", "--vz-primary", "--vz-warning", "--vz-danger", "--vz-success"]'
              />
            </CardBody>
          </Card>
        </Col>
        <Col xl={5}>
          <Card className="admin-dash-card account-chart-card mb-0 h-100">
            <CardHeader className="align-items-center d-flex admin-dash-card-header border-0">
              <h4 className="card-title mb-0 flex-grow-1">Share of cashflow</h4>
              <span className="text-muted small">Donut</span>
            </CardHeader>
            <CardBody className="pt-0">
              <FinanceDonutChart
                labels={donutLabels}
                values={donutValues}
                centerLabel="Cashflow"
                dataColors='["--vz-info", "--vz-warning", "--vz-danger", "--vz-success"]'
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row className="g-2 mt-0">
        <Col xl={5}>
          <Card className="admin-dash-card account-chart-card mb-0 h-100">
            <CardHeader className="align-items-center d-flex admin-dash-card-header border-0">
              <h4 className="card-title mb-0 flex-grow-1">Ops status</h4>
              <span className="text-muted small">Pie</span>
            </CardHeader>
            <CardBody className="pt-0">
              <FinancePieChart
                labels={pieLabels}
                values={pieValues}
                dataColors='["--vz-warning", "--vz-success", "--vz-danger"]'
              />
            </CardBody>
          </Card>
        </Col>
        <Col xl={7}>
          <Card className="admin-dash-card account-chart-card mb-0 h-100">
            <CardHeader className="align-items-center d-flex admin-dash-card-header border-0">
              <h4 className="card-title mb-0 flex-grow-1">This week collections</h4>
              <span className="text-muted small">Bar + trend</span>
            </CardHeader>
            <CardBody className="pt-0">
              <WeeklyAreaBarChart
                labels={DUMMY.weeklyLabels}
                collected={DUMMY.weeklyCollected}
                dataColors='["--vz-info", "--vz-primary"]'
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AccountCharts;
