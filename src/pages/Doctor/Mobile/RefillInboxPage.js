import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiddenLink } from "../../../helpers/hiddenRouteParams";
import { Badge, Container } from "reactstrap";

import { listDoctorRefills } from "../../../helpers/realbackend_helper";

const STATUS_FILTERS = ["PENDING", "APPROVED", "ORDERED", "REJECTED", "ALL"];

const STATUS_COLOR = { PENDING: "warning", APPROVED: "success", ORDERED: "info", REJECTED: "danger" };

const unwrapList = (payload) => {
  const body = payload?.data !== undefined && !Array.isArray(payload) && payload?.success === undefined
    ? payload.data
    : payload;
  const rows = Array.isArray(body) ? body : body?.data ?? body?.Data ?? [];
  return Array.isArray(rows) ? rows : [];
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return undefined;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

/**
 * DMO-09.02 — RefillInbox from GET /api/Refill (treating doctor).
 */
const RefillInboxPage = () => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    setOffline(false);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
      setError("You appear to be offline. Check your connection and try again.");
      setLoading(false);
      return;
    }
    listDoctorRefills(status)
      .then((payload) => setRows(unwrapList(payload)))
      .catch((err) => {
        setError(typeof err === "string" && err ? err : err?.message || "Could not load refill inbox.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    document.title = "Refill inbox | Homeocentrum";
    load();
  }, [load]);

  const emptyText =
    status === "PENDING"
      ? "No pending refill requests. Patients request refills from a signed prescription."
      : "No refill requests for this filter.";

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page" data-testid="refill-inbox">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title"><i className="ri-medicine-bottle-line" aria-hidden="true" />Refill inbox</h2>
            <p className="clinic-page-subtitle mb-0">
              Approve or reject repeat prescription requests. The signed prescription stays read-only.
            </p>
          </div>
          <div className="clinic-table-actions">
            <button type="button" className="btn btn-sm btn-soft-secondary clinic-action-btn" onClick={load} disabled={loading}>
              <i className="ri-refresh-line" aria-hidden="true" />
              {loading ? "Loading…" : "Refresh"}
            </button>
            <Link className="btn btn-sm btn-soft-primary clinic-action-btn" to="/doctor/mobile/context">
              <i className="ri-user-heart-line" aria-hidden="true" />
              Patient context
            </Link>
          </div>
        </div>

        <div className="clinic-table-actions mb-3" aria-label="Filter by status">
          {STATUS_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`btn btn-sm ${status === value ? "btn-soft-primary" : "btn-soft-secondary"}`}
              onClick={() => setStatus(value)}
              disabled={loading}
            >
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted" data-testid="refill-inbox-loading">
            Loading refills…
          </p>
        ) : null}

        {offline ? (
          <p className="text-warning" data-testid="refill-inbox-offline">
            {error}
          </p>
        ) : null}

        {!loading && error && !offline ? (
          <p className="text-danger" data-testid="refill-inbox-error">
            {error}
          </p>
        ) : null}

        <div className="card admin-dash-card">
          <div className="card-body">
            {!loading && !error && rows.length === 0 ? (
              <p className="text-muted mb-0" data-testid="refill-inbox-empty">
                {emptyText}
              </p>
            ) : null}

            {!loading && rows.length > 0 ? (
              <ul className="list-unstyled mb-0" data-testid="refill-inbox-list">
                {rows.map((row) => {
                  const id = pick(row, "refillRequestId", "RefillRequestId", "id");
                  const rowStatus = String(pick(row, "status", "Status") || "—").toUpperCase();
                  const patientName = pick(row, "patientName", "PatientName");
                  const patientId = pick(row, "patientId", "PatientId");
                  const erxId = pick(row, "erxSnapshotId", "ErxSnapshotId");
                  const appId = pick(row, "patientAppId", "PatientAppId");
                  const reason = pick(row, "reason", "Reason");
                  return (
                    <li
                      key={id}
                      className="d-flex justify-content-between align-items-start gap-2 py-3 border-bottom"
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <strong>{patientName || `Patient ${patientId ?? "—"}`}</strong>
                          <Badge color={STATUS_COLOR[rowStatus] || "secondary"}>{rowStatus}</Badge>
                        </div>
                        <div className="small text-muted">
                          Refill #{id} · eRx #{erxId ?? "—"}
                          {appId ? ` · Appointment #${appId}` : ""}
                        </div>
                        <div className="small text-muted">
                          Requested {formatDateTime(pick(row, "createdAt", "CreatedAt"))}
                          {pick(row, "decidedAt", "DecidedAt")
                            ? ` · Decided ${formatDateTime(pick(row, "decidedAt", "DecidedAt"))}`
                            : ""}
                        </div>
                        {reason ? <div className="small text-danger">Reason: {reason}</div> : null}
                      </div>
                      <HiddenLink
                        className="btn btn-sm btn-soft-primary clinic-action-btn"
                        to={`/doctor/mobile/refill/detail?refillId=${id}`}
                      >
                        <i className="ri-eye-line" aria-hidden="true" />
                        {rowStatus === "PENDING" ? "Review" : "Open"}
                      </HiddenLink>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default RefillInboxPage;
