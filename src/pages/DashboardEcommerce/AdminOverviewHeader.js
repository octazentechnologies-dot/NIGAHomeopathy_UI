import React from "react";
import Flatpickr from "react-flatpickr";
import moment from "moment";
import { downloadCsv, formatRupees } from "./adminDashboardFormat";
import "./adminOverviewHeader.css";

const AdminOverviewHeader = ({ range, onRangeChange, doctorId, onDoctorChange, doctors = [], summary }) => {
  const handleRangeChange = (dates) => {
    if (dates.length === 2) onRangeChange([moment(dates[0]).startOf("day").toDate(), moment(dates[1]).startOf("day").toDate()]);
  };

  const handleExport = () => {
    const kpis = summary?.kpis;
    if (!kpis) return;
    const doctor = doctors.find((row) => String(row.doctorId) === String(doctorId));
    const period = `${moment(range[0]).format("DD MMM YYYY")} - ${moment(range[1]).format("DD MMM YYYY")}`;
    downloadCsv(`platform-overview-${moment(range[0]).format("YYYYMMDD")}-${moment(range[1]).format("YYYYMMDD")}.csv`, [
      ["Platform Overview"],
      ["Period", period],
      ["Doctor", doctor?.doctorName || "All doctors"],
      [],
      ["Metric", "This period", "Previous period"],
      ["Appointments", kpis.appointments, kpis.prevAppointments],
      ["Completed", kpis.completed, ""],
      ["Cancelled", kpis.cancelled, ""],
      ["New patients", kpis.newPatients, kpis.prevNewPatients],
      ["Follow-up rate %", kpis.followUpRate, kpis.prevFollowUpRate],
      ["Revenue", formatRupees(kpis.revenue, true), formatRupees(kpis.prevRevenue, true)],
      ["Consult revenue", formatRupees(kpis.consultRevenue, true), ""],
      ["Medicine revenue", formatRupees(kpis.medicineRevenue, true), ""],
      ["Medicine orders", kpis.medicineOrders, ""],
      ["Doctors (verified / total)", `${kpis.verifiedDoctors ?? 0} / ${kpis.doctors}`, ""],
      ["Patients", kpis.patients, ""],
    ]);
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
            options={{ mode: "range", dateFormat: "d M Y", maxDate: "today", disableMobile: true }}
          />
        </label>
        <button
          type="button"
          className="apo-icon-btn"
          title="Export overview"
          aria-label="Export overview"
          disabled={!summary?.kpis}
          onClick={handleExport}
        >
          <i className="ri-upload-2-line" aria-hidden="true" />
        </button>
        <div className="apo-select">
          <select value={doctorId} onChange={(e) => onDoctorChange(e.target.value)} aria-label="Doctor">
            <option value="">All doctors</option>
            {doctors.map((row) => (
              <option key={row.doctorId} value={row.doctorId}>
                {row.doctorName}
                {row.clinicName && !String(row.doctorName || "").toLowerCase().includes(row.clinicName.trim().toLowerCase())
                  ? ` — ${row.clinicName}`
                  : ""}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewHeader;
