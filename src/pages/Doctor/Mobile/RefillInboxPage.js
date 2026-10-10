import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiddenLink } from "../../../helpers/hiddenRouteParams";
import { Badge, ButtonGroup, Button, Container } from "reactstrap";

import { listDoctorRefills } from "../../../helpers/realbackend_helper";

const STATUS_FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"];

const STATUS_COLOR = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

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
        <h2 className="clinic-page-title mb-2">Refill inbox</h2>
        <p className="clinic-page-subtitle small mb-3">
          Approve or reject repeat prescription requests. The signed prescription stays read-only.
        </p>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <ButtonGroup size="sm" aria-label="Filter by status">
            {STATUS_FILTERS.map((value) => (
              <Button
                key={value}
                color="primary"
                outline={status !== value}
                onClick={() => setStatus(value)}
                disabled={loading}
              >
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </Button>
            ))}
          </ButtonGroup>
          <Button size="sm" color="secondary" outline onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
          <Link className="btn btn-sm btn-link" to="/doctor/mobile/context">
            Patient context
          </Link>
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

        {!loading && !error && rows.length === 0 ? (
          <div className="border rounded p-4 text-muted" data-testid="refill-inbox-empty">
            {emptyText}
          </div>
        ) : null}

        {!loading && rows.length > 0 ? (
          <ul className="list-unstyled" data-testid="refill-inbox-list">
            {rows.map((row) => {
              const id = pick(row, "refillRequestId", "RefillRequestId", "id");
              const rowStatus = String(pick(row, "status", "Status") || "—").toUpperCase();
              const patientName = pick(row, "patientName", "PatientName");
              const patientId = pick(row, "patientId", "PatientId");
              const erxId = pick(row, "erxSnapshotId", "ErxSnapshotId");
              const appId = pick(row, "patientAppId", "PatientAppId");
              const reason = pick(row, "reason", "Reason");
              return (
                <li key={id} className="border rounded p-3 mb-2 d-flex justify-content-between align-items-start gap-2">
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
                  <HiddenLink className="btn btn-sm btn-primary" to={`/doctor/mobile/refill/detail?refillId=${id}`}>
                    {rowStatus === "PENDING" ? "Review" : "Open"}
                  </HiddenLink>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Container>
    </div>
  );
};

export default RefillInboxPage;
