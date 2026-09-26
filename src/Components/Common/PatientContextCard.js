import React, { useEffect, useState } from "react";
import { getDoctorMobileContext } from "../../helpers/realbackend_helper";

const unwrapContext = (payload) => {
  const root = payload?.data !== undefined ? payload.data : payload;
  const data = root?.data ?? root?.Data ?? root;
  if (!data || typeof data !== "object") return null;
  return {
    patientAppId: data.patientAppId ?? data.PatientAppId ?? null,
    patientId: data.patientId ?? data.PatientId ?? null,
    name: data.name ?? data.Name ?? "—",
    age: data.age ?? data.Age ?? null,
    chiefComplaint: data.chiefComplaint ?? data.ChiefComplaint ?? null,
    lastVisit: data.lastVisit ?? data.LastVisit ?? null,
    paymentStatus: data.paymentStatus ?? data.PaymentStatus ?? null,
    consultMode: data.consultMode ?? data.ConsultMode ?? null,
    teleStatus: data.teleStatus ?? data.TeleStatus ?? null,
  };
};

/**
 * DMO-07.02 — read-only PatientCard from GET /api/DoctorMobile/Context/{patientAppId}.
 * No case-taking tabs. No repertory calls. paymentStatus / teleStatus from API only.
 */
const PatientContextCard = ({ patientAppId, className = "" }) => {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(Boolean(patientAppId));
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const id = Number(patientAppId);
    if (!id) {
      setCtx(null);
      setLoading(false);
      setError("");
      setOffline(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setOffline(false);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
      setError("You appear to be offline. Check your connection and try again.");
      setLoading(false);
      return undefined;
    }
    getDoctorMobileContext(id)
      .then((payload) => {
        if (cancelled) return;
        const row = unwrapContext(payload);
        if (!row) {
          setError("Context card returned no data.");
          setCtx(null);
          return;
        }
        setCtx(row);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err?.response?.status ?? err?.status;
        if (status === 403) {
          setError("Not allowed to read this patient.");
        } else if (status === 404) {
          setError("Appointment not found.");
        } else {
          setError(err?.message || "Could not load patient context.");
        }
        setCtx(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientAppId]);

  if (!patientAppId) {
    return (
      <div className={`patient-context-card text-muted ${className}`} data-testid="patient-context-empty">
        No visit selected.
      </div>
    );
  }

  return (
    <div
      className={`patient-context-card border rounded p-3 ${className}`}
      data-testid="patient-context-card"
    >
      {loading ? (
        <p className="text-muted mb-0" data-testid="patient-context-loading">
          Loading patient context…
        </p>
      ) : null}
      {offline ? (
        <p className="text-warning mb-0" data-testid="patient-context-offline">
          {error}
        </p>
      ) : null}
      {!loading && error && !offline ? (
        <p className="text-danger mb-0" data-testid="patient-context-error">
          {error}
        </p>
      ) : null}
      {ctx ? (
        <div data-testid="patient-context-body">
          <h6 className="mb-2">{ctx.name}</h6>
          <p className="mb-1 small">
            <strong>Age:</strong> {ctx.age != null ? ctx.age : "—"}
          </p>
          <p className="mb-1 small">
            <strong>Chief complaint:</strong> {ctx.chiefComplaint || "—"}
          </p>
          <p className="mb-1 small">
            <strong>Last visit:</strong>{" "}
            {ctx.lastVisit
              ? String(ctx.lastVisit).slice(0, 10)
              : "—"}
          </p>
          <p className="mb-1 small">
            <strong>Payment:</strong> {ctx.paymentStatus || "—"}
          </p>
          <p className="mb-1 small">
            <strong>Mode:</strong> {ctx.consultMode || "—"}
          </p>
          <p className="mb-0 small">
            <strong>Tele:</strong> {ctx.teleStatus || "—"}
          </p>
          <p className="mb-0 mt-2 text-muted small">
            Visit #{ctx.patientAppId} · read-only context (no case-taking)
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default PatientContextCard;
