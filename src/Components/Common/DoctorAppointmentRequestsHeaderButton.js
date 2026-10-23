import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserRole } from "../constants/roles";
import {
  listAppointmentRequests,
  unwrapClinic,
} from "../../helpers/doctorClinicApi";
import { subscribeAppointmentRequests } from "../../helpers/clinicRealtime";

const openStatuses = new Set(["PENDING", "PROPOSED"]);

const countOpen = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) =>
    openStatuses.has(String(row.status || row.Status || "").toUpperCase())
  ).length;

/**
 * Doctor topbar icon for Appointment requests + live pending badge (SignalR).
 * Initial count is fetched once; updates arrive over the hub (no polling).
 */
const DoctorAppointmentRequestsHeaderButton = ({ userRole }) => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const active = String(location.pathname || "")
    .toLowerCase()
    .startsWith("/doctor/appointment-requests");

  useEffect(() => {
    if (userRole !== UserRole.DOCTOR) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const rows = unwrapClinic(await listAppointmentRequests());
        if (!cancelled) setPendingCount(countOpen(rows));
      } catch {
        if (!cancelled) setPendingCount(0);
      }
    })();

    const unsub = subscribeAppointmentRequests((payload) => {
      const next = Number(payload?.pendingCount ?? payload?.PendingCount);
      if (Number.isFinite(next) && next >= 0) {
        setPendingCount(next);
        return;
      }
      // Fallback: bump/drop locally if server omitted pendingCount
      const type = String(payload?.eventType || payload?.EventType || "").toLowerCase();
      setPendingCount((prev) => {
        if (type === "created") return prev + 1;
        if (["cancelled", "accepted", "declined", "patient_responded"].includes(type)) {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [userRole]);

  if (userRole !== UserRole.DOCTOR) return null;

  const label =
    pendingCount > 0
      ? `Appointment requests (${pendingCount} open)`
      : "Appointment requests";

  return (
    <div className="ms-1 header-item">
      <Link
        to="/doctor/appointment-requests"
        className={`btn btn-icon btn-topbar btn-ghost-secondary rounded-circle position-relative${
          active ? " active" : ""
        }`}
        title={label}
        aria-label={label}
      >
        <i className="ri-mail-check-line fs-20" />
        {pendingCount > 0 ? (
          <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
            {pendingCount > 99 ? "99+" : pendingCount}
            <span className="visually-hidden">open appointment requests</span>
          </span>
        ) : null}
      </Link>
    </div>
  );
};

export default DoctorAppointmentRequestsHeaderButton;
