import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "reactstrap";

import {
  approveDoctorRefill,
  rejectDoctorRefill,
} from "../../../helpers/realbackend_helper";

/**
 * DMO-09.02 — RefillDetail approve/reject via Phase 8–15 APIs.
 * Reject requires reason. Cannot edit prescription snapshot here.
 */
const RefillDetailPage = () => {
  const { refillId } = useParams();
  const id = Number(refillId);

  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  const apiMessage = (err) => {
    const d = err?.response?.data ?? err?.data ?? err;
    if (typeof d === "string" && d.trim()) return d;
    const fromBody = d?.message || d?.Message;
    if (fromBody) return fromBody;
    return err?.message || "Request failed.";
  };

  const run = async (fn) => {
    setError("");
    setResult(null);
    setOffline(false);
    if (!id) {
      setError("Refill id is required.");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
      setError("You appear to be offline. Check your connection and try again.");
      return;
    }
    setLoading(true);
    try {
      const payload = await fn();
      const root = payload?.data !== undefined ? payload.data : payload;
      setResult({
        status: root?.status ?? root?.Status ?? payload?.status,
        message: root?.message ?? root?.Message ?? "OK",
        success: root?.success ?? root?.Success ?? true,
        raw: root,
      });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => run(() => approveDoctorRefill(id));

  const handleReject = () => {
    if (!String(reason || "").trim()) {
      setError("Reject reason is required.");
      return;
    }
    run(() => rejectDoctorRefill(id, reason.trim()));
  };

  return (
    <div className="page-content" data-testid="refill-detail">
      <Container fluid className="py-4" style={{ maxWidth: 640 }}>
        <h4 className="mb-2">Refill #{id || "—"}</h4>
        <p className="text-muted small mb-3">
          Approve or reject from the API. Prescription snapshot is not editable on this screen.
        </p>

        {!id ? (
          <p className="text-muted" data-testid="refill-detail-empty">
            No refill selected. Open one from the inbox.
          </p>
        ) : (
          <div className="border rounded p-4 mb-3" data-testid="refill-detail-body">
            <p className="small text-muted mb-3">
              Until prescriptions exist, unknown ids return 404 from the server — that is expected.
            </p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={handleApprove}
                aria-label="Approve refill"
              >
                {loading ? "Working…" : "Approve"}
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
            />
            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={loading}
              onClick={handleReject}
              aria-label="Reject refill"
            >
              Reject
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-muted" data-testid="refill-detail-loading">
            Submitting…
          </p>
        ) : null}

        {offline ? (
          <p className="text-warning" data-testid="refill-detail-offline">
            {error}
          </p>
        ) : null}

        {!loading && error && !offline ? (
          <p className="text-danger" data-testid="refill-detail-error">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="border rounded p-3 mb-3" data-testid="refill-detail-result">
            <strong>{result.success === false ? "Not applied" : "API response"}</strong>
            <div className="small">{result.message}</div>
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
