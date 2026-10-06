import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Badge, Container, Input, Spinner } from "reactstrap";
import moment from "moment";
import {
  getConsultationSummary,
  getConsultNote,
  getPatientVisits,
  listTeleChat,
  postTeleChat,
  rejoinTeleSession,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { reportTeleJoinFailure, teleJoinFailureCode } from "../../../helpers/realbackend_helper";
import "../Prescriptions/patientPrescriptions.css";

const asList = (payload) => {
  const data = unwrapS4(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const field = (row, camel) => row?.[camel] ?? row?.[camel.charAt(0).toUpperCase() + camel.slice(1)];

const normalizeVisit = (row) => ({
  patientAppId: field(row, "patientAppId"),
  date: field(row, "appointmentDate"),
  time: field(row, "appointmentTime"),
  status: String(field(row, "status") || "").toUpperCase(),
  mode: field(row, "consultMode") || (field(row, "isTele") ? "Online" : "In clinic"),
  isTele: Boolean(field(row, "isTele")),
  doctorName: field(row, "doctorName") || "Doctor",
  sessionId: field(row, "teleSessionId"),
  sessionStatus: String(field(row, "sessionStatus") || ""),
  chatCount: Number(field(row, "chatCount") || 0),
  hasSummary: Boolean(field(row, "hasSummary")),
});

const visitLabel = (visit) =>
  `${visit.date ? moment(visit.date).format("DD MMM YYYY") : "—"}${visit.time ? ` ${visit.time}` : ""} · ${visit.doctorName}`;

const isLiveSession = (visit) => /^(active|waiting|started|live)$/i.test(visit.sessionStatus);

const Shell = ({ title, subtitle, children }) => (
  <div className="page-content admin-dashboard-page clinic-workspace-page prx-page">
    <Container fluid>
      <div className="prx-page__header">
        <div>
          <h2 className="clinic-page-title">{title}</h2>
          <p className="clinic-page-subtitle">{subtitle}</p>
        </div>
      </div>
      {children}
    </Container>
  </div>
);

const useOffline = () => {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return offline;
};

/** Loads the signed-in patient's own visits so no ids or mobile numbers are typed. */
const usePatientVisits = (filter) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setVisits(asList(await getPatientVisits()).map(normalizeVisit));
    } catch (err) {
      setVisits([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => visits.filter(filter), [visits, filter]);
  return { visits: filtered, loading, error, reload: load };
};

const VisitPicker = ({ id, label, visits, value, onChange, renderExtra, emptyText }) => {
  if (visits.length === 0) return <p className="text-muted mb-0">{emptyText}</p>;
  return (
    <>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <Input id={id} type="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {visits.map((visit) => (
          <option key={visit.patientAppId} value={String(visit.patientAppId)}>
            {visitLabel(visit)}
            {renderExtra ? renderExtra(visit) : ""}
          </option>
        ))}
      </Input>
    </>
  );
};

const hasSession = (visit) => Boolean(visit.sessionId);
const hasSummaryOrVisit = (visit) => visit.status !== "CANCELLED";

export const PatientChatPage = () => {
  document.title = "Visit chat | Niga Homeocentrum";
  const offline = useOffline();
  const [searchParams] = useSearchParams();
  const { visits, loading: visitsLoading, error: visitsError } = usePatientVisits(hasSession);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listEndRef = useRef(null);

  const selected = visits.find((visit) => String(visit.patientAppId) === selectedId) || null;

  useEffect(() => {
    if (!visits.length || selectedId) return;
    const fromQuery = searchParams.get("patientAppId");
    const match = fromQuery && visits.find((visit) => String(visit.patientAppId) === fromQuery);
    setSelectedId(String((match || visits[0]).patientAppId));
  }, [visits, selectedId, searchParams]);

  const load = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      setMessages(asList(await listTeleChat(sessionId)));
    } catch (err) {
      setMessages([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected?.sessionId) load(selected.sessionId);
    else setMessages([]);
  }, [selected?.sessionId, load]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages.length]);

  const send = async () => {
    const text = body.trim();
    if (!selected?.sessionId || !text) return;
    setSending(true);
    setError("");
    try {
      await postTeleChat({ sessionId: selected.sessionId, body: text });
      setBody("");
      await load(selected.sessionId);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Shell title="Visit chat" subtitle="Messages with your doctor for an online visit.">
      {offline ? <Alert color="warning">You appear to be offline. Chat will send when you are back online.</Alert> : null}
      {visitsError ? <Alert color="danger">{visitsError}</Alert> : null}
      {error ? <Alert color="danger">{error}</Alert> : null}
      <div className="prx-card">
        <div className="prx-card__body">
          {visitsLoading ? (
            <p className="text-muted mb-0">
              <Spinner size="sm" /> Loading your visits…
            </p>
          ) : (
            <VisitPicker
              id="chat-visit"
              label="Online visit"
              visits={visits}
              value={selectedId}
              onChange={setSelectedId}
              renderExtra={(visit) => (visit.chatCount ? ` · ${visit.chatCount} message(s)` : "")}
              emptyText="Chat opens once you have an online visit with a doctor."
            />
          )}

          {selected ? (
            <>
              <div className="border rounded p-3 my-3" style={{ maxHeight: 360, overflowY: "auto" }}>
                {loading ? (
                  <p className="text-muted mb-0">
                    <Spinner size="sm" /> Loading messages…
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-muted mb-0">No messages for this visit yet.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {messages.map((row, index) => {
                      const role = String(field(row, "senderRole") || field(row, "role") || "");
                      const mine = /patient/i.test(role);
                      return (
                        <li
                          key={field(row, "teleChatMessageId") || index}
                          className={`mb-2 d-flex ${mine ? "justify-content-end" : "justify-content-start"}`}
                        >
                          <div
                            className={`rounded px-3 py-2 ${mine ? "bg-primary text-white" : "bg-light"}`}
                            style={{ maxWidth: "75%" }}
                          >
                            <div className="small fw-semibold">{mine ? "You" : selected.doctorName}</div>
                            <div>{field(row, "body") || field(row, "text")}</div>
                            <div className={`small ${mine ? "text-white-50" : "text-muted"}`}>
                              {field(row, "at") ? moment(field(row, "at")).format("DD MMM, hh:mm A") : ""}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    <li ref={listEndRef} />
                  </ul>
                )}
              </div>
              <Input
                type="textarea"
                value={body}
                maxLength={1000}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message"
                disabled={sending}
              />
              <div className="d-flex gap-2 mt-2">
                <button type="button" className="btn btn-primary" onClick={send} disabled={!body.trim() || sending}>
                  {sending ? <Spinner size="sm" /> : "Send"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => load(selected.sessionId)}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Shell>
  );
};

export const PatientRejoinPage = () => {
  document.title = "Rejoin call | Niga Homeocentrum";
  const offline = useOffline();
  const { visits, loading: visitsLoading, error: visitsError, reload } = usePatientVisits(isLiveSession);
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(null);

  useEffect(() => {
    if (visits.length && !visits.some((visit) => String(visit.patientAppId) === selectedId)) {
      setSelectedId(String(visits[0].patientAppId));
    }
  }, [visits, selectedId]);

  const selected = visits.find((visit) => String(visit.patientAppId) === selectedId) || null;

  const rejoin = async () => {
    if (!selected?.sessionId) return;
    setLoading(true);
    setError("");
    setResult(null);
    setFallback(null);
    try {
      const response = await rejoinTeleSession(selected.sessionId);
      setResult(response?.data && !Array.isArray(response.data) ? response.data : response || { success: true });
    } catch (err) {
      setError(s4Message(err));
      setFallback(await reportTeleJoinFailure(selected.sessionId, teleJoinFailureCode(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Rejoin call" subtitle="Use this after a dropped video call while the call is still active.">
      {offline ? <Alert color="warning">You appear to be offline. Rejoin needs a connection.</Alert> : null}
      {visitsError ? <Alert color="danger">{visitsError}</Alert> : null}
      {error ? <Alert color="danger">{error}</Alert> : null}
      <div className="prx-card">
        <div className="prx-card__body">
          {visitsLoading ? (
            <p className="text-muted mb-0">
              <Spinner size="sm" /> Checking for an active call…
            </p>
          ) : (
            <VisitPicker
              id="rejoin-visit"
              label="Active call"
              visits={visits}
              value={selectedId}
              onChange={(value) => {
                setSelectedId(value);
                setResult(null);
              }}
              renderExtra={(visit) => ` · ${visit.sessionStatus}`}
              emptyText="You have no active video call right now. Rejoin appears here if a call drops while it is still open."
            />
          )}
          <div className="d-flex gap-2 mt-3">
            {selected ? (
              <button type="button" className="btn btn-primary" onClick={rejoin} disabled={loading || offline}>
                {loading ? <Spinner size="sm" /> : "Rejoin"}
              </button>
            ) : null}
            <button type="button" className="btn btn-outline-secondary" onClick={reload} disabled={visitsLoading}>
              Refresh
            </button>
          </div>
          {result ? (
            <Alert color="success" className="mt-3 mb-0">
              You are reconnected to room {field(result, "roomId") || "—"}. Call status:{" "}
              {field(result, "status") || selected?.sessionStatus || "Active"}.
              {field(result, "isStub") ? " The video provider is not connected yet, so no media will play." : ""}
            </Alert>
          ) : null}
          {fallback ? (
            <Alert color="warning" className="mt-3 mb-0" data-testid="rejoin-fallback">
              <p className="mb-2">{fallback.message || "Could not join the call."}</p>
              <div className="d-flex flex-wrap gap-2">
                {fallback.retry ? (
                  <button type="button" className="btn btn-sm btn-primary" onClick={rejoin} disabled={loading || offline}>
                    Try again
                  </button>
                ) : null}
                <a className="btn btn-sm btn-outline-secondary" href={fallback.supportPath || "/patient/support"}>
                  Contact support
                </a>
              </div>
            </Alert>
          ) : null}
        </div>
      </div>
    </Shell>
  );
};

export const PatientSummaryPage = () => {
  document.title = "Consultation summary | Niga Homeocentrum";
  const offline = useOffline();
  const [searchParams] = useSearchParams();
  const { visits, loading: visitsLoading, error: visitsError } = usePatientVisits(hasSummaryOrVisit);
  const [selectedId, setSelectedId] = useState("");
  const [summaries, setSummaries] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visits.length || selectedId) return;
    const fromQuery = searchParams.get("patientAppId");
    const match =
      (fromQuery && visits.find((visit) => String(visit.patientAppId) === fromQuery)) ||
      visits.find((visit) => visit.hasSummary) ||
      visits[0];
    setSelectedId(String(match.patientAppId));
  }, [visits, selectedId, searchParams]);

  useEffect(() => {
    const id = Number(selectedId);
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.allSettled([getConsultationSummary(id), getConsultNote(id)]).then(([summaryResult, noteResult]) => {
      if (cancelled) return;
      const list = summaryResult.status === "fulfilled" ? asList(summaryResult.value) : [];
      const single = summaryResult.status === "fulfilled" ? unwrapS4(summaryResult.value) : null;
      setSummaries(list.length ? list : single && !Array.isArray(single) && field(single, "text") ? [single] : []);
      const noteBody = noteResult.status === "fulfilled" ? unwrapS4(noteResult.value) : null;
      setNote(field(noteBody, "text") || field(noteBody, "note") || "");
      if (summaryResult.status === "rejected" && noteResult.status === "rejected") {
        const message = s4Message(summaryResult.reason);
        if (!/not found|no consultation/i.test(message)) setError(message);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selected = visits.find((visit) => String(visit.patientAppId) === selectedId) || null;
  const summaryTexts = summaries.map((row) => field(row, "text")).filter(Boolean);
  const showNote = note && !summaryTexts.includes(note);

  return (
    <Shell title="Consultation summary" subtitle="The note your doctor saved for a visit. Remedy names stay hidden until the pharmacy accepts the order.">
      {offline ? <Alert color="warning">You appear to be offline.</Alert> : null}
      {visitsError ? <Alert color="danger">{visitsError}</Alert> : null}
      {error ? <Alert color="danger">{error}</Alert> : null}
      <div className="prx-card">
        <div className="prx-card__body">
          {visitsLoading ? (
            <p className="text-muted mb-0">
              <Spinner size="sm" /> Loading your visits…
            </p>
          ) : (
            <VisitPicker
              id="summary-visit"
              label="Visit"
              visits={visits}
              value={selectedId}
              onChange={setSelectedId}
              renderExtra={(visit) => (visit.hasSummary ? " · summary ready" : "")}
              emptyText="Summaries appear here after your first visit."
            />
          )}

          {selected ? (
            <div className="mt-3">
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <Badge color="light" className="text-dark">{selected.mode}</Badge>
                {selected.status ? <Badge color="secondary">{selected.status}</Badge> : null}
              </div>
              {loading ? (
                <p className="text-muted mb-0">
                  <Spinner size="sm" /> Loading summary…
                </p>
              ) : summaryTexts.length === 0 && !note ? (
                <p className="text-muted mb-0">No summary has been written for this visit yet.</p>
              ) : (
                <>
                  {summaries.map((row, index) =>
                    field(row, "text") ? (
                      <div key={field(row, "consultationSummaryId") || index} className="border rounded p-3 mb-2">
                        <div className="small text-muted mb-1">
                          {field(row, "at") ? moment(field(row, "at")).format("DD MMM YYYY, hh:mm A") : ""}
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{field(row, "text")}</div>
                      </div>
                    ) : null
                  )}
                  {showNote ? (
                    <p className="mt-2 mb-0">
                      <strong>Consultation note. </strong>
                      {note}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
};
