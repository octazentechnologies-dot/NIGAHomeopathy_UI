import React, { useCallback, useEffect, useState } from "react";
import {
  createTeleSession,
  endTeleSession,
  getTeleQueue,
  getTeleSessionStatus,
  issueTeleSessionRejoinToken,
  issueTeleSessionToken,
  listTeleChat,
  postTeleChat,
  saveTeleConsultationSummary,
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

const unwrapList = (payload) => {
  const root = payload?.data !== undefined ? payload.data : payload;
  const nested = root?.data ?? root?.Data ?? root;
  return Array.isArray(nested) ? nested : Array.isArray(root) ? root : [];
};

const messageOf = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.Message ||
  err?.data?.message ||
  err?.message ||
  fallback;

/**
 * DMO-08.01 / DMO-08.02 — VideoRoom + tele session tokens (Token / Rejoin).
 * Session id comes from route after create, or open a visit from today's tele queue —
 * doctor never types TeleSessionId.
 */
const TeleVideoRoom = ({ sessionId, patientAppId = "", onSessionCreated, className = "" }) => {
  const [activeSessionId, setActiveSessionId] = useState(sessionId ? String(sessionId) : "");
  const [session, setSession] = useState(null);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [queue, setQueue] = useState([]);
  const [queueNote, setQueueNote] = useState("");
  const [chatRows, setChatRows] = useState([]);
  const [chatText, setChatText] = useState("");
  const [summaryText, setSummaryText] = useState("");

  useEffect(() => {
    if (sessionId) setActiveSessionId(String(sessionId));
  }, [sessionId]);

  const loadQueue = useCallback(async () => {
    setQueueNote("");
    try {
      const payload = await getTeleQueue();
      const rows = unwrapList(payload);
      setQueue(rows);
      if (!rows.length) setQueueNote("No tele visits in today's queue.");
    } catch (err) {
      setQueue([]);
      setQueueNote(messageOf(err, "Could not load tele queue."));
    }
  }, []);

  const loadStatus = useCallback(() => {
    const id = Number(activeSessionId);
    if (!id) {
      setPhase("pick");
      setError("");
      setSession(null);
      loadQueue();
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
  }, [activeSessionId, loadQueue]);

  useEffect(() => loadStatus(), [loadStatus]);

  useEffect(() => {
    const id = Number(activeSessionId);
    if (!id) {
      setChatRows([]);
      return undefined;
    }
    let cancelled = false;
    listTeleChat(id)
      .then((payload) => {
        if (cancelled) return;
        setChatRows(unwrapList(payload));
      })
      .catch(() => {
        if (!cancelled) setChatRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

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

  const openFromVisit = async (appId) => {
    const pid = Number(appId);
    if (!pid) {
      setError("Pick a tele visit from the queue.");
      return;
    }
    try {
      const payload = await runAction("create", () =>
        createTeleSession({ patientAppId: pid })
      );
      const row = unwrapSession(payload) || {};
      const createdId =
        row.teleSessionId ||
        payload?.teleSessionId ||
        payload?.TeleSessionId ||
        payload?.data?.teleSessionId ||
        payload?.data?.TeleSessionId;
      if (!createdId) {
        setError("Session create returned no id.");
        return;
      }
      setActiveSessionId(String(createdId));
      if (typeof onSessionCreated === "function") {
        onSessionCreated(String(createdId), String(pid));
      }
    } catch {
      /* error set */
    }
  };

  const onStart = async () => {
    try {
      await runAction("start", () => startTeleSession(Number(activeSessionId)));
      loadStatus();
    } catch {
      /* error set */
    }
  };

  const onJoinToken = async () => {
    try {
      const tok = await runAction("token", () => issueTeleSessionToken(Number(activeSessionId)));
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
        issueTeleSessionRejoinToken(Number(activeSessionId))
      );
      setTokenPayload(tok);
    } catch {
      /* error set */
    }
  };

  const onEnd = async () => {
    try {
      await runAction("end", () => endTeleSession(Number(activeSessionId)));
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
      {phase === "pick" ? (
        <div data-testid="videoroom-pick" role="status">
          <p className="text-muted mb-2">
            Open a tele visit from today&apos;s queue.
          </p>
          {patientAppId ? (
            <button
              type="button"
              className="btn btn-primary btn-sm mb-3"
              disabled={!!busy}
              onClick={() => openFromVisit(patientAppId)}
              data-testid="videoroom-open-from-context"
            >
              {busy === "create" ? "Opening…" : "Open room for this visit"}
            </button>
          ) : null}
          {queueNote ? <p className="text-muted small">{queueNote}</p> : null}
          {queue.length > 0 ? (
            <ul className="list-unstyled mb-0" data-testid="videoroom-queue">
              {queue.map((row) => {
                const appId = row.patientAppId ?? row.PatientAppId;
                const name = row.patientName ?? row.PatientName ?? "Patient";
                const time = row.appointmentTime ?? row.AppointmentTime ?? "";
                return (
                  <li key={appId} className="d-flex justify-content-between align-items-center gap-2 py-2 border-bottom">
                    <span className="text-truncate">
                      {name}
                      {time ? ` · ${time}` : ""}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm flex-shrink-0"
                      disabled={!!busy}
                      onClick={() => openFromVisit(appId)}
                      data-testid={`videoroom-queue-${appId}`}
                    >
                      Open room
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <button
            type="button"
            className="btn btn-link btn-sm px-0 mt-2"
            onClick={loadQueue}
            disabled={!!busy}
          >
            Refresh queue
          </button>
          {error ? (
            <p className="text-danger small mt-2" role="alert">
              {error}
            </p>
          ) : null}
        </div>
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
          <button type="button" className="btn btn-outline-secondary btn-sm me-2" onClick={loadStatus}>
            Retry
          </button>
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => {
              setActiveSessionId("");
              setPhase("pick");
            }}
          >
            Pick another visit
          </button>
        </div>
      ) : null}

      {phase === "ready" && session ? (
        <div className="border rounded p-3 bg-light" data-testid="videoroom-body">
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
                {tokenPayload.isStub
                  ? "(stub / keys not ready — no live A/V media)"
                  : "(client SDK can join with token + clientConfig)"}
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
              {tokenPayload.clientConfig ? (
                <p className="mb-1 small text-muted" data-testid="videoroom-client-config">
                  <strong>Client config:</strong>{" "}
                  <code>{JSON.stringify(tokenPayload.clientConfig)}</code>
                </p>
              ) : null}
            <p className="mb-0 small text-muted">
                Recording allowed: {tokenPayload.recordAllowed ? "yes" : "no"} · Status{" "}
                {tokenPayload.status || session.status}. Waiting room / rejoin / chat use poll APIs — no
                SignalR. Live A/V starts when Agora (or vendor) keys are set; this build uses a stub token.
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

          <div className="border rounded p-3 bg-light mt-3" data-testid="tele-chat-panel">
            <h6 className="mb-2">In-room chat</h6>
            <div className="small mb-2" style={{ maxHeight: 140, overflow: "auto" }}>
              {chatRows.length === 0 ? (
                <p className="text-muted mb-0">No messages yet.</p>
              ) : (
                chatRows.map((row, idx) => (
                  <p key={row.teleChatId || row.TeleChatId || idx} className="mb-1">
                    <strong>{row.authorRole || row.AuthorRole || "User"}:</strong> {row.body || row.Body}
                  </p>
                ))
              )}
            </div>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Message"
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!chatText.trim() || !!busy}
                onClick={async () => {
                  const id = Number(activeSessionId);
                  if (!id) return;
                  await runAction("chat", async () => {
                    await postTeleChat({ sessionId: id, body: chatText.trim() });
                    setChatText("");
                    const payload = await listTeleChat(id);
                    setChatRows(unwrapList(payload));
                  });
                }}
              >
                Send
              </button>
            </div>
          </div>

          <div className="border rounded p-3 bg-light mt-3" data-testid="tele-summary-form">
            <h6 className="mb-2">Post-call summary</h6>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="Consultation summary for the patient"
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={!summaryText.trim() || !!busy}
              onClick={async () => {
                const appId = Number(session?.patientAppId || patientAppId);
                if (!appId) {
                  setError("Patient appointment id is required to save a summary.");
                  return;
                }
                await runAction("summary", async () => {
                  await saveTeleConsultationSummary({ patientAppId: appId, text: summaryText.trim() });
                  setSummaryText("");
                });
              }}
            >
              Save summary
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TeleVideoRoom;
