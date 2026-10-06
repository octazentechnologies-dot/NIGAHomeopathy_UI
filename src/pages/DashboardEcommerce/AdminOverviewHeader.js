import React, { useState } from "react";
import Flatpickr from "react-flatpickr";
import moment from "moment";
import { ecomWidgets } from "../../common/data";
import "./adminOverviewHeader.css";

const CLINIC_OPTIONS = [
  { value: "all", label: "All Clinics" },
  { value: "pune-central", label: "Pune Central Clinic" },
  { value: "mumbai-andheri", label: "Mumbai Andheri Clinic" },
  { value: "nashik", label: "Nashik Clinic" },
  { value: "online", label: "Online Consultations" },
];

const defaultRange = () => [moment().startOf("month").toDate(), moment().endOf("month").toDate()];

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const AdminOverviewHeader = () => {
  const [range, setRange] = useState(defaultRange);
  const [clinic, setClinic] = useState("all");

  const handleRangeChange = (dates) => {
    if (dates.length === 2) setRange(dates);
  };

  const handleExport = () => {
    const clinicLabel = CLINIC_OPTIONS.find((c) => c.value === clinic)?.label || "All Clinics";
    const period = `${moment(range[0]).format("DD MMM YYYY")} - ${moment(range[1]).format("DD MMM YYYY")}`;
    const rows = [
      ["Platform Overview"],
      ["Period", period],
      ["Clinic", clinicLabel],
      [],
      ["Metric", "Value", "Change vs last month"],
      ...ecomWidgets.map((w) => [
        w.label,
        `${w.prefix || ""}${w.counter}${w.suffix || ""}`,
        `${w.percentage}%`,
      ]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-overview-${moment(range[0]).format("YYYYMMDD")}-${moment(range[1]).format("YYYYMMDD")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="apo-head">
      <h2 className="apo-head__title">Platform Overview</h2>
      <div className="apo-head__controls">
        <label className="apo-range" aria-label="Date range">
          <i className="ri-calendar-2-line" aria-hidden="true" />
          <Flatpickr
            className="apo-range__input"
            value={range}
            onChange={handleRangeChange}
            options={{ mode: "range", dateFormat: "d M Y", disableMobile: true }}
          />
        </label>
        <button
          type="button"
          className="apo-icon-btn"
          title="Export overview"
          aria-label="Export overview"
          onClick={handleExport}
        >
          <i className="ri-upload-2-line" aria-hidden="true" />
        </button>
        <div className="apo-select">
          <select
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            aria-label="Clinic"
          >
            {CLINIC_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewHeader;
