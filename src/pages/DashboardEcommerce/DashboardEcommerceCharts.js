import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../Components/Common/ChartsDynamicColor";
import { formatRupees } from "./adminDashboardFormat";

const VisitTrendChart = ({ dataColors, trend = [] }) => {
  const colors = getChartColorsArray(dataColors);
  const series = [
    { name: "Appointments", type: "area", data: trend.map((row) => row.appointments) },
    { name: "Revenue", type: "bar", data: trend.map((row) => Number(row.revenue) || 0) },
    { name: "New patients", type: "line", data: trend.map((row) => row.newPatients) },
  ];

  const options = {
    chart: { height: 370, type: "line", toolbar: { show: false } },
    stroke: { curve: "straight", dashArray: [0, 0, 8], width: [2, 0, 2.2] },
    fill: { opacity: [0.1, 0.9, 1] },
    markers: { size: [0, 0, 0], strokeWidth: 2, hover: { size: 4 } },
    xaxis: {
      categories: trend.map((row) => row.label),
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: { hideOverlappingLabels: true, rotate: -30 },
    },
    yaxis: [
      { seriesName: "Appointments", title: { text: "Visits" }, labels: { formatter: (y) => Math.round(y) } },
      { seriesName: "Revenue", opposite: true, title: { text: "Revenue" }, labels: { formatter: (y) => formatRupees(y) } },
      { seriesName: "Appointments", show: false },
    ],
    grid: {
      show: true,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { top: 0, right: -2, bottom: 15, left: 10 },
    },
    legend: {
      show: true,
      horizontalAlign: "center",
      offsetX: 0,
      offsetY: -5,
      markers: { width: 9, height: 9, radius: 6 },
      itemMargin: { horizontal: 10, vertical: 0 },
    },
    plotOptions: { bar: { columnWidth: "30%", barHeight: "70%" } },
    colors,
    tooltip: {
      shared: true,
      y: [
        { formatter: (y) => (typeof y === "number" ? `${y} visits` : y) },
        { formatter: (y) => (typeof y === "number" ? formatRupees(y, true) : y) },
        { formatter: (y) => (typeof y === "number" ? `${y} new` : y) },
      ],
    },
    noData: { text: "No appointments in this period" },
  };

  return (
    <ReactApexChart dir="ltr" options={options} series={series} type="line" height="370" className="apex-charts" />
  );
};

const ConsultModeChart = ({ dataColors, modes = [] }) => {
  const colors = getChartColorsArray(dataColors);
  const options = {
    labels: modes.map((row) => row.name),
    chart: { height: 333, type: "donut" },
    legend: { position: "bottom" },
    stroke: { show: false },
    dataLabels: { dropShadow: { enabled: false } },
    colors,
    noData: { text: "No appointments in this period" },
  };
  return (
    <ReactApexChart
      dir="ltr"
      options={options}
      series={modes.map((row) => row.count)}
      type="donut"
      height="333"
      className="apex-charts"
    />
  );
};

export { VisitTrendChart, ConsultModeChart };
