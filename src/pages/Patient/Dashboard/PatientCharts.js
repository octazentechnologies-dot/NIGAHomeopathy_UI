import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import ReactEcharts from "echarts-for-react";
import moment from "moment";
import { Card, CardBody, CardHeader, Col, Row, Spinner } from "reactstrap";

const CHART_COLORS = ["#25a0e2", "#0ab39c", "#f7b84b", "#f06548", "#299cdb", "#6559cc"];

const STATUS_LABELS = [
  ["WAITING", "Waiting"],
  ["WALK-IN", "Walk-in"],
  ["NOT ARRIVED", "Not arrived"],
  ["E-CONSULT", "Tele consultation"],
  ["REMAINING", "Remaining"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

const statusLabel = (status) => {
  const s = String(status || "").trim().toUpperCase().replace(/_/g, " ").replace(/\s+/g, " ");
  if (!s) return "Other";
  if (/CANCEL|REJECT|FAIL/.test(s)) return "Cancelled";
  if (/COMPLETE|DONE|CLOSED/.test(s)) return "Completed";
  if (/NOT\s*ARRIV/.test(s)) return "Not arrived";
  if (/WALK/.test(s)) return "Walk-in";
  if (/E-?\s*CONSULT|TELE/.test(s)) return "Tele consultation";
  if (/REMAIN/.test(s)) return "Remaining";
  if (/WAIT|CHECK/.test(s)) return "Waiting";
  const known = STATUS_LABELS.find(([key]) => key === s);
  return known ? known[1] : String(status).trim();
};

const visitDay = (row) => {
  const raw = row?.appointmentDate ?? row?.AppointmentDate;
  if (!raw) return null;
  const m = moment(raw);
  return m.isValid() ? m.clone().startOf("day") : null;
};

const VisitStatusChart = ({ visits = [], loading }) => {
  const { labels, series, total } = useMemo(() => {
    const counts = {};
    (Array.isArray(visits) ? visits : []).forEach((row) => {
      const key = statusLabel(row?.status ?? row?.Status);
      counts[key] = (counts[key] || 0) + 1;
    });
    const order = STATUS_LABELS.map(([, label]) => label);
    const labelsOut = order.filter((k) => counts[k]);
    Object.keys(counts).forEach((k) => {
      if (!labelsOut.includes(k)) labelsOut.push(k);
    });
    return {
      labels: labelsOut,
      series: labelsOut.map((k) => counts[k] || 0),
      total: labelsOut.reduce((sum, k) => sum + (counts[k] || 0), 0),
    };
  }, [visits]);

  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#858d98", fontSize: 11 },
      data: labels,
    },
    color: CHART_COLORS,
    series: [
      {
        name: "Visits",
        type: "pie",
        center: ["50%", "42%"],
        radius: ["44%", "68%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: { shadowBlur: 12, shadowColor: "rgba(15, 34, 58, 0.12)" },
        },
        data: labels.map((name, i) => ({ name, value: series[i] })),
      },
    ],
    graphic:
      total > 0
        ? [
            {
              type: "text",
              left: "center",
              top: "38%",
              style: {
                text: `${total}`,
                textAlign: "center",
                fill: "#495057",
                fontSize: 22,
                fontWeight: 600,
                fontFamily: "Poppins, sans-serif",
              },
            },
            {
              type: "text",
              left: "center",
              top: "46%",
              style: {
                text: "Total",
                textAlign: "center",
                fill: "#858d98",
                fontSize: 11,
                fontFamily: "Poppins, sans-serif",
              },
            },
          ]
        : [],
    textStyle: { fontFamily: "Poppins, sans-serif" },
  };

  return (
    <Col xl={4} className="d-flex">
      <Card className="h-100 flex-grow-1 w-100 patient-stats-card mb-0">
        <CardHeader className="align-items-center d-flex doctor-dashboard-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Visit status</h4>
        </CardHeader>
        <CardBody className="patient-stats-card-body">
          {loading ? (
            <div className="text-center text-muted py-3">
              <Spinner size="sm" className="me-2" />
              Loading…
            </div>
          ) : total === 0 ? (
            <div className="text-center text-muted py-3">
              <i className="ri-pie-chart-2-line fs-2 d-block mb-2" />
              No visits in this range yet.
            </div>
          ) : (
            <ReactEcharts className="patient-stats-chart" style={{ height: 300 }} option={option} />
          )}
        </CardBody>
      </Card>
    </Col>
  );
};

const VisitsTrendChart = ({ visits = [], loading }) => {
  const { categories, visitCounts, teleCounts } = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      months.push(moment().subtract(i, "months").startOf("month"));
    }
    const visitCountsOut = months.map(() => 0);
    const teleCountsOut = months.map(() => 0);
    (Array.isArray(visits) ? visits : []).forEach((row) => {
      const day = visitDay(row);
      if (!day) return;
      const idx = months.findIndex((m) => day.isSame(m, "month"));
      if (idx < 0) return;
      visitCountsOut[idx] += 1;
      const mode = String(row?.consultMode ?? row?.ConsultMode ?? "").toLowerCase();
      const isTele = !!(row?.isTele ?? row?.IsTele) || mode.includes("tele");
      if (isTele) teleCountsOut[idx] += 1;
    });
    return {
      categories: months.map((m) => m.format("MMM YY")),
      visitCounts: visitCountsOut,
      teleCounts: teleCountsOut,
    };
  }, [visits]);

  const hasData = visitCounts.some((n) => n > 0);

  const options = {
    chart: { height: 300, type: "bar", toolbar: { show: false }, stacked: false },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "48%", borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    colors: [CHART_COLORS[0], CHART_COLORS[1]],
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#858d98", fontSize: "11px" } },
    },
    yaxis: {
      labels: { style: { colors: "#858d98", fontSize: "11px" }, formatter: (v) => Math.round(v) },
      min: 0,
      forceNiceScale: true,
    },
    grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
    legend: {
      position: "top",
      horizontalAlign: "right",
      markers: { width: 10, height: 10, radius: 2 },
      fontSize: "11px",
    },
    tooltip: {
      y: { formatter: (val) => `${val} visit${val === 1 ? "" : "s"}` },
    },
  };

  const series = [
    { name: "All visits", data: visitCounts },
    { name: "Tele", data: teleCounts },
  ];

  return (
    <Col xl={8} className="d-flex">
      <Card className="h-100 flex-grow-1 w-100 patient-stats-card mb-0">
        <CardHeader className="align-items-center d-flex doctor-dashboard-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Visits — last 6 months</h4>
        </CardHeader>
        <CardBody className="patient-stats-card-body">
          {loading ? (
            <div className="text-center text-muted py-3">
              <Spinner size="sm" className="me-2" />
              Loading…
            </div>
          ) : !hasData ? (
            <div className="text-center text-muted py-3">
              <i className="ri-bar-chart-grouped-line fs-2 d-block mb-2" />
              No visit history to chart yet.
            </div>
          ) : (
            <ReactApexChart options={options} series={series} type="bar" height={300} className="apex-charts" />
          )}
        </CardBody>
      </Card>
    </Col>
  );
};

const PaymentsSparkChart = ({ payments = [], loading }) => {
  const { categories, paid, pending } = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      months.push(moment().subtract(i, "months").startOf("month"));
    }
    const paidOut = months.map(() => 0);
    const pendingOut = months.map(() => 0);
    (Array.isArray(payments) ? payments : []).forEach((row) => {
      const raw = row?.createdAt ?? row?.CreatedAt ?? row?.at ?? row?.At ?? row?.paymentDate;
      const m = raw ? moment(raw) : null;
      if (!m || !m.isValid()) return;
      const idx = months.findIndex((month) => m.isSame(month, "month"));
      if (idx < 0) return;
      const status = String(row?.status ?? row?.Status ?? row?.paymentStatus ?? row?.PaymentStatus ?? "").toUpperCase();
      const amount = Number(row?.amount ?? row?.Amount ?? row?.consultFee ?? row?.ConsultFee ?? 0) || 0;
      if (/REFUND/.test(status)) return;
      if (/PAID|CAPTURED|COLLECTED|SUCCESS/.test(status)) paidOut[idx] += amount;
      else pendingOut[idx] += amount;
    });
    return {
      categories: months.map((m) => m.format("MMM")),
      paid: paidOut,
      pending: pendingOut,
    };
  }, [payments]);

  const hasData = paid.some((n) => n > 0) || pending.some((n) => n > 0);

  const options = {
    chart: { height: 280, type: "area", toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    colors: [CHART_COLORS[1], CHART_COLORS[2]],
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    xaxis: {
      categories,
      labels: { style: { colors: "#858d98", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#858d98", fontSize: "11px" },
        formatter: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${Math.round(v)}`),
      },
    },
    grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
    legend: { position: "top", horizontalAlign: "right", fontSize: "11px" },
    tooltip: {
      y: { formatter: (val) => `₹${Number(val || 0).toLocaleString("en-IN")}` },
    },
  };

  return (
    <Col xs={12} className="d-flex patient-payments-chart">
      <Card className="h-100 flex-grow-1 w-100 patient-stats-card mb-0">
        <CardHeader className="align-items-center d-flex doctor-dashboard-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Payments trend</h4>
        </CardHeader>
        <CardBody className="patient-stats-card-body">
          {loading ? (
            <div className="text-center text-muted py-3">
              <Spinner size="sm" className="me-2" />
              Loading…
            </div>
          ) : !hasData ? (
            <div className="text-center text-muted py-3">
              <i className="ri-line-chart-line fs-2 d-block mb-2" />
              No payment activity in the last 6 months.
            </div>
          ) : (
            <ReactApexChart
              options={options}
              series={[
                { name: "Paid", data: paid },
                { name: "Pending", data: pending },
              ]}
              type="area"
              height={280}
              className="apex-charts"
            />
          )}
        </CardBody>
      </Card>
    </Col>
  );
};

const PatientCharts = ({ visits, payments, loading }) => (
  <Row className="patient-dashboard-charts align-items-stretch">
    <VisitStatusChart visits={visits} loading={loading} />
    <VisitsTrendChart visits={visits} loading={loading} />
    <PaymentsSparkChart payments={payments} loading={loading} />
  </Row>
);

export default PatientCharts;
