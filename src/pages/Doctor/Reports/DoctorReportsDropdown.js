import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown, DropdownMenu, DropdownToggle } from "reactstrap";
import "./doctorReports.css";

export const DOCTOR_REPORTS = [
  {
    path: "/doctor/reports/practice",
    label: "Doctor Practice Analysis",
    hint: "Consultations, patient mix & services",
    icon: "ri-stethoscope-line",
    tone: "blue",
  },
  {
    path: "/doctor/reports/follow-up",
    label: "Follow-up Analysis",
    hint: "Completed, due & overdue follow-ups",
    icon: "ri-calendar-check-line",
    tone: "green",
  },
  {
    path: "/doctor/reports/clinic-performance",
    label: "Clinical Performance Analysis",
    hint: "Appointments, no-shows & utilisation",
    icon: "ri-hospital-line",
    tone: "purple",
  },
  {
    path: "/doctor/reports/earnings",
    label: "Doctor Earning Analysis",
    hint: "Earnings trend, payouts & transactions",
    icon: "ri-wallet-3-line",
    tone: "amber",
  },
];

const DoctorReportsDropdown = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onReports = pathname.startsWith("/doctor/reports");

  return (
    <Dropdown isOpen={open} toggle={() => setOpen((v) => !v)} className="ms-1 header-item">
      <DropdownToggle
        tag="button"
        type="button"
        className={`btn btn-icon btn-topbar btn-ghost-secondary rounded-circle${onReports ? " active" : ""}`}
        title="Reports"
        aria-label="Reports"
      >
        <i className="ri-bar-chart-box-line fs-20" />
      </DropdownToggle>
      <DropdownMenu end className="drp-menu">
        <div className="drp-menu__title">Reports</div>
        {DOCTOR_REPORTS.map((r) => (
          <Link
            key={r.path}
            to={r.path}
            className={`drp-menu__item${pathname === r.path ? " is-active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <span className={`drp-menu__icon drp-menu__icon--${r.tone}`}>
              <i className={r.icon} aria-hidden="true" />
            </span>
            <span className="drp-menu__text">
              <strong>{r.label}</strong>
              <small>{r.hint}</small>
            </span>
          </Link>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default DoctorReportsDropdown;
