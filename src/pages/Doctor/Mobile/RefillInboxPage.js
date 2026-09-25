import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "reactstrap";

import { listDoctorRefills } from "../../../helpers/realbackend_helper";

const unwrapList = (payload) => {
  const root = payload?.data !== undefined ? payload.data : payload;
  const rows = root?.data ?? root?.Data ?? [];
  const message = root?.message ?? root?.Message ?? payload?.message ?? "";
  return {
    rows: Array.isArray(rows) ? rows : [],
    message: typeof message === "string" ? message : "",
  };
};

/**
 * DMO-09.02 — RefillInbox from GET /api/Refill (treating doctor).
 * Empty until prescriptions exist — do not invent requests locally.
 */
const RefillInboxPage = () => {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
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
    listDoctorRefills()
      .then((payload) => {
        const { rows: list, message: msg } = unwrapList(payload);
        setRows(list);
        setMessage(msg);
      })
      .catch((err) => {
        const status = err?.response?.status ?? err?.status;
        if (status === 403) {
          setError("Refill approval is for the treating doctor.");
        } else {
          setError(err?.message || "Could not load refill inbox.");
        }
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = "Refill inbox | Homeocentrum";
    load();
  }, [load]);

  return (
    <div className="page-content" data-testid="refill-inbox">
      <Container fluid className="py-4" style={{ maxWidth: 720 }}>
        <h4 className="mb-2">Refill inbox</h4>
        <p className="text-muted small mb-3">
          Approve or reject repeat prescription requests. Snapshot is read-only — no local edits.
        </p>

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
          <div
            className="border rounded p-4 text-muted"
            data-testid="refill-inbox-empty"
          >
            {message || "No refill requests until prescriptions are in place."}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className="list-unstyled" data-testid="refill-inbox-list">
            {rows.map((row) => {
              const id = row.refillRequestId ?? row.RefillRequestId ?? row.id;
              const status = row.status ?? row.Status ?? "—";
              const patientId = row.patientId ?? row.PatientId;
              return (
                <li key={id} className="border rounded p-3 mb-2 d-flex justify-content-between gap-2">
                  <div>
                    <strong>#{id}</strong>
                    <div className="small text-muted">
                      Patient {patientId ?? "—"} · {status}
                    </div>
                  </div>
                  <Link
                    className="btn btn-sm btn-primary"
                    to={`/doctor/mobile/refill/${id}`}
                  >
                    Open
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        <button
          type="button"
          className="btn btn-outline-secondary me-2"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
        <Link className="btn btn-link" to="/doctor/mobile/context">
          Patient context
        </Link>
      </Container>
    </div>
  );
};

export default RefillInboxPage;
