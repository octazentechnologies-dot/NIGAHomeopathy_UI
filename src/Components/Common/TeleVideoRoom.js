import React, { useCallback, useEffect, useState } from "react";
import {
  endTeleSession,
  getTeleSessionStatus,
  issueTeleSessionRejoinToken,
  issueTeleSessionToken,
  startTeleSession,
} from "../../helpers/realbackend_helper";

const unwrapSession = (payload) => {
  const root = payload?.data !== undefined ? payload.data : payload;
  const data = root?.data ?? root?.Data ?? root;
  if (!data || typeof data !== "object") return null;
  return {
    teleSessionId: data.teleSessionId ?? data.TeleSessionId ?? null,
    patientAppId: data.patientAppId ?? data.PatientAppId ?? null,
    doctorId: data.doctorId ?? data.DoctorId ?? null,
    patientId: data.patientId ?? data.PatientId ?? null,
    roomId: data.roomId ?? data.RoomId ?? null,
    status: data.status ?? data.Status ?? "Waiting",
    recordAllowed: Boolean(data.recordAllowed ?? data.RecordAllowed),
  };
};

const messageOf = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.Message ||
  err?.data?.message ||
  err?.message ||
  fallback;

/**
 * DMO-08.01 / DMO-08.02 — VideoRoom + tele session tokens (Token / Rejoin).
 * Uses New-API only. Stub vendor token — do not invent in-call or paid state.
 */
const TeleVideoRoom = ({ sessionId, className = "" }) => {
  const [session, setSession] = useState(null);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadStatus = useCallback(() => {
    const id = Number(sessionId);
    if (!id) {
      setPhase("empty");
      setError("Missing tele session id.");
      setSession(null);
      return undefined;
    }
    let cancelled = false;
    setPhase("loading");
    setError("");
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPhase("offline");
      setError("You appear to be offline. Check your connection and try again.");
      return undefined;
    }
    getTeleSessionStatus(id)
      .then((payload) => {
        if (cancelled) return;
        const row = unwrapSession(payload);
        if (!row) {
          setPhase("error");
          setError("Session returned no data.");
          return;
        }
        setSession(row);
        setPhase("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err?.response?.status ?? err?.status;
        if (status === 403) setError("Not allowed on this session.");
        else if (status === 404) setError("Session not found.");
        else setError(messageOf(err, "Could not load session."));
        setPhase("error");
        setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => loadStatus(), [loadStatus]);

  const runAction = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(messageOf(err, "Action failed."));
      throw err;
    } finally {
      setBusy("");
    }
  };

  const onStart = async () => {
    try {
      await runAction("start", () => startTeleSession(Number(sessionId)));
      loadStatus();
    } catch {
      /* error set */
    }
  };

  const onJoinToken = async () => {
    try {
      const tok = await runAction("token", () => issueTeleSessionToken(Number(sessionId)));
      setTokenPayload(tok);
      if (tok.status) {
        setSession((prev) => (prev ? { ...prev, status: tok.status } : prev));
      }
    } catch {
      /* error set */
    }
  };

  const onRejoin = async () => {
    try {
      const tok = await runAction("rejoin", () =>
        issueTeleSessionRejoinToken(Number(sessionId))
      );
      setTokenPayload(tok);
    } catch {
      /* error set */
    }
  };

  const onEnd = async () => {
    try {
      await runAction("end", () => endTeleSession(Number(sessionId)));
      setTokenPayload(null);
      loadStatus();
    } catch {
      /* error set */
    }
  };

  const status = String(session?.status || "").toLowerCase();
  const isActive = status === "active";
  const isWaiting = status === "waiting";
  const isEnded = status === "ended";
  const tokenPreview = tokenPayload?.token
    ? `${String(tokenPayload.token).slice(0, 18)}…`
    : "";

  return (
    <div className={className} data-testid="tele-video-room">
      {phase === "empty" ? (
        <p className="text-muted" data-testid="videoroom-empty" role="status">
          No session id. Open <code>/doctor/mobile/videoroom/&#123;sessionId&#125;</code>.
        </p>
      ) : null}
      {phase === "loading" ? (
        <p className="text-muted" data-testid="videoroom-loading" role="status" aria-busy="true">
          Loading video room…
        </p>
      ) : null}
      {phase === "offline" ? (
        <p className="text-warning" data-testid="videoroom-offline" role="alert">
          {error}
        </p>
      ) : null}
      {phase === "error" ? (
        <div role="alert" data-testid="videoroom-error">
          <p className="text-danger mb-2">{error}</p>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadStatus}>
            Retry
          </button>
        </div>
      ) : null}

      {phase === "ready" && session ? (
        <div className="border rounded p-3 bg-light" data-testid="videoroom-body">
          <p className="mb-2">
            <strong>Session #</strong>
            {session.teleSessionId}
          </p>
          <p className="mb-2">
            <strong>Visit #</strong>
            {session.patientAppId}
          </p>
          <p className="mb-2">
            <strong>Room:</strong> {session.roomId}
          </p>
          <p className="mb-3" data-testid="videoroom-status">
            <strong>Status:</strong> {session.status}
          </p>

          <div className="d-flex flex-wrap gap-2 mb-3">
            {isWaiting ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!!busy}
                onClick={onStart}
                aria-label="Start tele session"
              >
                {busy === "start" ? "Starting…" : "Start session"}
              </button>
            ) : null}
            {isActive ? (
              <>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  disabled={!!busy}
                  onClick={onJoinToken}
                  aria-label="Get tele session token"
                >
                  {busy === "token" ? "Getting token…" : "Get join token"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  disabled={!!busy}
                  onClick={onRejoin}
                  aria-label="Rejoin tele session"
                >
                  {busy === "rejoin" ? "Rejoining…" : "Rejoin token"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  disabled={!!busy}
                  onClick={onEnd}
                  aria-label="End tele session"
                >
                  {busy === "end" ? "Ending…" : "End session"}
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={!!busy}
              onClick={loadStatus}
              aria-label="Refresh session status"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <p className="text-danger small" role="alert">
              {error}
            </p>
          ) : null}

          {tokenPayload ? (
            <div className="border rounded p-3 bg-white" data-testid="videoroom-token" aria-live="polite">
              <p className="mb-1">
                <strong>Vendor:</strong> {tokenPayload.vendor}{" "}
                {tokenPayload.isStub ? "(stub — not a live vendor call)" : ""}
              </p>
              <p className="mb-1">
                <strong>Clients:</strong> {(tokenPayload.clients || []).join(", ")}
              </p>
              <p className="mb-1">
                <strong>Token:</strong> <code>{tokenPreview}</code>
              </p>
              <p className="mb-1">
                <strong>Expires:</strong> {tokenPayload.expiresAt || "—"}
              </p>
              <p className="mb-0 small text-muted">
                Recording allowed: {tokenPayload.recordAllowed ? "yes" : "no"} · Status{" "}
                {tokenPayload.status || session.status}. Payment / signed state is not set here.
              </p>
            </div>
          ) : (
            <p className="text-muted small mb-0" data-testid="videoroom-token-empty">
              {isEnded
                ? "Session ended. Token and Rejoin are not available."
                : isActive
                  ? "Request a join token to enter the room (same JSON for phone and web)."
                  : "Start the session so the patient waiting room becomes Active, then get a token."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default TeleVideoRoom;
