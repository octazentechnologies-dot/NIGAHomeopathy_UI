import React, { useEffect, useState } from "react";
import { Alert, Container, Input, Spinner } from "reactstrap";
import {
  getConsultationSummary,
  getConsultNote,
  listTeleChat,
  postTeleChat,
  rejoinTeleSession,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import "../Prescriptions/patientPrescriptions.css";

const asList = (payload) => {
  const data = unwrapS4(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

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

export const PatientChatPage = () => {
  document.title = "Visit chat | Niga Homeocentrum";
  const offline = useOffline();
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (id) => {
    const session = Number(id);
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const rows = asList(await listTeleChat(session));
      setMessages(rows);
    } catch (err) {
      setMessages([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const session = Number(sessionId);
    const text = body.trim();
    if (!session || !text) return;
    setError("");
    try {
      await postTeleChat({ sessionId: session, body: text });
      setBody("");
      await load(session);
    } catch (err) {
      setError(s4Message(err));
    }
  };

  return (
    <Shell title="Visit chat" subtitle="Messages for one tele session. Enter the session number from your visit.">
      {offline ? <Alert color="warning">You appear to be offline. Chat will send when you are back online.</Alert> : null}
      {error ? <Alert color="danger">{error}</Alert> : null}
      <div className="prx-card">
        <div className="prx-card__body">
          <label className="form-label" htmlFor="chat-session">Session number</label>
          <div className="d-flex gap-2 mb-3">
            <Input id="chat-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session id" />
            <button type="button" className="btn btn-primary" onClick={() => load(sessionId)} disabled={loading || !sessionId}>
              {loading ? <Spinner size="sm" /> : "Load"}
            </button>
          </div>
          {messages.length === 0 && !loading ? <p className="text-muted">No messages for this session yet.</p> : null}
          <ul className="list-unstyled">
            {messages.map((row, index) => (
              <li key={row.id || row.Id || index} className="mb-2">
                <strong>{row.senderName || row.SenderName || row.role || row.Role || "Message"}</strong>
                <div>{row.body || row.Body || row.text || row.Text}</div>
              </li>
            ))}
          </ul>
          <Input type="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" />
          <button type="button" className="btn btn-primary mt-2" onClick={send} disabled={!body.trim() || !sessionId}>
            Send
          </button>
        </div>
      </div>
    </Shell>
  );
};

export const PatientRejoinPage = () => {
  document.title = "Rejoin call | Niga Homeocentrum";
  const offline = useOffline();
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rejoin = async () => {
    const session = Number(sessionId);
    if (!session) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(unwrapS4(await rejoinTeleSession(session)) || { success: true });
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Rejoin call" subtitle="Use this after a dropped video call while the session is still active.">
      {offline ? <Alert color="warning">You appear to be offline. Rejoin needs a connection.</Alert> : null}
      {error ? <Alert color="danger">{error}</Alert> : null}
      <div className="prx-card">
        <div className="prx-card__body">
          <label className="form-label" htmlFor="rejoin-session">Session number</label>
          <Input id="rejoin-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session id" />
          <button type="button" className="btn btn-primary mt-3" onClick={rejoin} disabled={loading || !sessionId}>
            {loading ? <Spinner size="sm" /> : "Rejoin"}
          </button>
          {result ? (
            <Alert color="success" className="mt-3 mb-0">
              Rejoin token is ready. Room {result.roomId || result.RoomId || "—"}.
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
  const [patientAppId, setPatientAppId] = useState("");
  const [summary, setSummary] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const id = Number(patientAppId);
    if (!id) return;
    setLoading(true);
    setError("");
    const [summaryResult, noteResult] = await Promise.allSettled([
      getConsultationSummary(id),
      getConsultNote(id),
    ]);
    if (summaryResult.status === "fulfilled") setSummary(unwrapS4(summaryResult.value));
    else setSummary(null);
    if (noteResult.status === "fulfilled") {
      const body = unwrapS4(noteResult.value);
      setNote(body?.text || body?.Text || body?.note || body?.Note || (typeof body === "string" ? body : ""));
    } else setNote("");
    if (summaryResult.status === "rejected" && noteResult.status === "rejected") {
      setError(s4Message(summaryResult.reason));
    }
    setLoading(false);
  };

  const text = summary?.text || summary?.Text || summary?.summary || summary?.Summary || "";

  return (
    <Shell title="Consultation summary" subtitle="The note saved for one visit. Remedy names stay hidden until the pharmacy accepts the order.">
      {offline ? <Alert color="warning">You appear to be offline.</Alert> : null}
      {error ? <Alert color="danger">{error}</Alert> : null}
      <div className="prx-card">
        <div className="prx-card__body">
          <label className="form-label" htmlFor="summary-visit">Visit number</label>
          <div className="d-flex gap-2">
            <Input id="summary-visit" value={patientAppId} onChange={(e) => setPatientAppId(e.target.value)} placeholder="Patient appointment id" />
            <button type="button" className="btn btn-primary" onClick={load} disabled={loading || !patientAppId}>
              {loading ? <Spinner size="sm" /> : "Load"}
            </button>
          </div>
          {!loading && summary && !text ? <p className="text-muted mt-3 mb-0">No summary has been written for this visit.</p> : null}
          {text ? <p className="mt-3 mb-0">{text}</p> : null}
          {note ? <p className="mt-3 mb-0"><strong>Consultation note. </strong>{note}</p> : null}
        </div>
      </div>
    </Shell>
  );
};
