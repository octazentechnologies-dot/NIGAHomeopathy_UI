import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Container, Table } from "reactstrap";

import {
  approveDoctorRefill,
  getDoctorRefill,
  rejectDoctorRefill,
} from "../../../helpers/realbackend_helper";

const STATUS_COLOR = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

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

const errorText = (err, fallback) => {
  if (typeof err === "string" && err) return err;
  return err?.data?.message || err?.data?.Message || err?.message || fallback;
};

/**
 * DMO-09.02 — RefillDetail: read the signed prescription, then approve or reject.
 * Reject requires a reason. The prescription snapshot cannot be edited here.
 */
const RefillDetailPage = () => {
  const { refillId } = useParams();
  const id = Number(refillId);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    getDoctorRefill(id)
      .then((payload) => setDetail(payload?.data ?? payload?.Data ?? null))
      .catch((err) => {
        setDetail(null);
        setLoadError(errorText(err, "Could not load this refill."));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    document.title = "Refill review | Homeocentrum";
    load();
  }, [load]);

  const refill = detail?.refill ?? detail?.Refill ?? null;
  const items = detail?.items ?? detail?.Items ?? [];
  const status = String(pick(refill, "status", "Status") || "").toUpperCase();
  const isPending = status === "PENDING";

  const decide = async (fn, successText) => {
    setError("");
    setNotice("");
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You appear to be offline. Check your connection and try again.");
      return;
    }
    setBusy(true);
    try {
      await fn();
      setNotice(successText);
      setReason("");
      load();
    } catch (err) {
      setError(errorText(err, "Request failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = () => decide(() => approveDoctorRefill(id), "Refill approved.");

  const handleReject = () => {
    if (!reason.trim()) {
      setError("Reject reason is required.");
      return;
    }
    decide(() => rejectDoctorRefill(id, reason.trim()), "Refill rejected.");
  };

  return (
    <div className="page-content" data-testid="refill-detail">
      <Container fluid className="py-4" style={{ maxWidth: 760 }}>
        <h4 className="mb-2">Refill {id ? `#${id}` : "—"}</h4>
        <p className="text-muted small mb-3">
          Review the signed prescription, then approve or reject. The prescription is not editable here.
        </p>

        {!id ? (
          <p className="text-muted" data-testid="refill-detail-empty">
            No refill selected. Open one from the inbox.
          </p>
        ) : null}

        {loading ? (
          <p className="text-muted" data-testid="refill-detail-loading">
            Loading refill…
          </p>
        ) : null}

        {!loading && loadError ? (
          <p className="text-danger" data-testid="refill-detail-error">
            {loadError}
          </p>
        ) : null}

        {!loading && refill ? (
          <div className="border rounded p-4 mb-3" data-testid="refill-detail-body">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
              <div>
                <div className="fw-semibold">
                  {pick(refill, "patientName", "PatientName") || `Patient ${pick(refill, "patientId", "PatientId")}`}
                </div>
                <div className="small text-muted">
                  eRx #{pick(refill, "erxSnapshotId", "ErxSnapshotId")}
                  {pick(refill, "patientAppId", "PatientAppId")
                    ? ` · Appointment #${pick(refill, "patientAppId", "PatientAppId")}`
                    : ""}
                  {` · Signed ${formatDateTime(detail?.signedAt ?? detail?.SignedAt)}`}
                </div>
                <div className="small text-muted">
                  Requested {formatDateTime(pick(refill, "createdAt", "CreatedAt"))}
                  {pick(refill, "decidedAt", "DecidedAt")
                    ? ` · Decided ${formatDateTime(pick(refill, "decidedAt", "DecidedAt"))}`
                    : ""}
                </div>
              </div>
              <div>
                <Badge color={STATUS_COLOR[status] || "secondary"} className="fs-6">
                  {status || "—"}
                </Badge>
              </div>
            </div>

            <h6 className="mb-2">Prescription</h6>
            {items.length === 0 ? (
              <p className="small text-muted">No medicines on this prescription.</p>
            ) : (
              <Table size="sm" bordered responsive className="mb-3">
                <thead className="table-light">
                  <tr>
                    <th>Remedy</th>
                    <th>Potency</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${pick(item, "remedyCode", "RemedyCode")}-${index}`}>
                      <td>{pick(item, "remedyName", "RemedyName") || pick(item, "remedyCode", "RemedyCode") || "—"}</td>
                      <td>{pick(item, "potencyCode", "PotencyCode") || "—"}</td>
                      <td>{pick(item, "dose", "Dose") || "—"}</td>
                      <td>{pick(item, "frequency", "Frequency") || "—"}</td>
                      <td>{pick(item, "duration", "Duration") || "—"}</td>
                      <td>{pick(item, "instructions", "Instructions") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            {isPending ? (
              <>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={handleApprove}
                    aria-label="Approve refill"
                  >
                    {busy ? "Working…" : "Approve"}
                  </button>
                </div>
                <label className="form-label" htmlFor="refill-reject-reason">
                  Reject reason
                </label>
                <textarea
                  id="refill-reject-reason"
                  className="form-control mb-2"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-label="Reject reason"
                  placeholder="Required to reject"
                  disabled={busy}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={busy || !reason.trim()}
                  onClick={handleReject}
                  aria-label="Reject refill"
                >
                  Reject
                </button>
              </>
            ) : (
              <p className="small text-muted mb-0">
                This refill is {status.toLowerCase() || "closed"}. No further action.
                {pick(refill, "reason", "Reason") ? ` Reason: ${pick(refill, "reason", "Reason")}` : ""}
              </p>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="text-danger" data-testid="refill-detail-action-error">
            {error}
          </p>
        ) : null}

        {notice ? (
          <div className="alert alert-success py-2" data-testid="refill-detail-result">
            {notice}
          </div>
        ) : null}

        <Link className="btn btn-outline-secondary" to="/doctor/mobile/refill">
          Back to inbox
        </Link>
      </Container>
    </div>
  );
};

export default RefillDetailPage;
