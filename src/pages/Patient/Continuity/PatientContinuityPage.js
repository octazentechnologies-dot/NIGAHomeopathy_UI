import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Container, Input, Spinner } from "reactstrap";
import Swal from "sweetalert2";
import moment from "moment";

import {
  completeFollowUp,
  deletePatientDocument,
  getPatientConsents,
  getPatientDiary,
  getPatientFollowUps,
  getPatientProfileS4,
  getPatientProgress,
  getPatientTimeline,
  grantPatientConsent,
  listPatientDocuments,
  openPatientDocument,
  postDataRequest,
  postDiaryEntry,
  s4Message,
  uploadPatientDocument,
  unwrapS4,
  withdrawConsent,
} from "../../../helpers/s4Week4Api";
import "../Prescriptions/patientPrescriptions.css";
import "./patientContinuity.css";

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "items", "entries", "tasks", "events", "consents"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const formatDate = (value, format = "DD MMM YYYY") => (value ? moment(value).format(format) : "—");

const TIMELINE_META = {
  appointment: { label: "Consultation", icon: "ri-stethoscope-line", tone: "blue" },
  followup: { label: "Follow-up", icon: "ri-calendar-check-line", tone: "green" },
  erx: { label: "Prescription", icon: "ri-file-list-3-line", tone: "purple" },
  diary: { label: "Diary", icon: "ri-heart-pulse-line", tone: "amber" },
  order: { label: "Medicine order", icon: "ri-capsule-line", tone: "blue" },
};

const timelineType = (row) => {
  const raw = String(pick(row, "eventType", "EventType", "type", "Type") || "").toLowerCase();
  if (raw.includes("erx") || raw.includes("prescription")) return "erx";
  if (raw.includes("follow")) return "followup";
  if (raw.includes("diary")) return "diary";
  if (raw.includes("order") || raw.includes("medicine")) return "order";
  return "appointment";
};

const normalizeTimeline = (payload) => {
  const inner = payload && typeof payload === "object" && !Array.isArray(payload) && payload.data ? payload.data : payload;
  const direct = asList(inner);
  if (direct.length) {
    return direct.map((row, index) => ({
      id: pick(row, "eventId", "EventId", "id") || `e${index}`,
      type: timelineType(row),
      title: pick(row, "title", "Title") || "Event",
      summary: pick(row, "summary", "Summary") || "",
      at: pick(row, "occurredAt", "OccurredAt", "createdAt", "CreatedAt"),
    }));
  }
  const events = [];
  (inner?.appointments || inner?.Appointments || []).forEach((row, index) => {
    const status = String(pick(row, "title", "status", "Status") || "").trim();
    if (status.toUpperCase() === "CANCELLED") return;
    events.push({
      id: `apt-${pick(row, "refId", "patientAppId", "PatientAppId") || index}`,
      type: "appointment",
      title: `Visit ${status}`.trim(),
      summary: pick(row, "doctorName", "DoctorName") || "",
      at: pick(row, "at", "At", "appointmentDate", "AppointmentDate"),
    });
  });
  (inner?.prescriptions || inner?.Prescriptions || []).forEach((row, index) => {
    events.push({
      id: `erx-${pick(row, "erxSnapshotId", "ErxSnapshotId") || index}`,
      type: "erx",
      title: "Prescription signed",
      summary: `eRx ${pick(row, "erxSnapshotId", "ErxSnapshotId") || "—"}`,
      at: pick(row, "signedAt", "SignedAt"),
    });
  });
  return events;
};

const normalizeFollowUp = (row, index) => ({
  id: pick(row, "followUpTaskId", "FollowUpTaskId", "taskId", "TaskId", "id") || `f${index}`,
  title: pick(row, "title", "Title") || "Follow-up task",
  due: pick(row, "dueDate", "DueDate", "dueAt", "DueAt"),
  done: Boolean(pick(row, "completedAt", "CompletedAt")) || /done|complete/i.test(String(pick(row, "status", "Status") || "")),
});

const normalizeDiary = (row, index) => ({
  id: pick(row, "symptomDiaryId", "SymptomDiaryId", "diaryId", "DiaryId", "id") || `d${index}`,
  note: pick(row, "note", "Note", "body", "Body") || "—",
  severity: pick(row, "severity", "Severity"),
  at: pick(row, "entryDate", "EntryDate", "createdAt", "CreatedAt"),
});

const normalizeConsent = (row, index) => ({
  id: pick(row, "consentTypeId", "ConsentTypeId") || `c${index}`,
  typeId: pick(row, "consentTypeId", "ConsentTypeId"),
  recordId: pick(row, "consentRecordId", "ConsentRecordId"),
  title: pick(row, "title", "Title", "code", "Code") || "Consent",
  purpose: pick(row, "description", "Description") || "",
  granted: Boolean(row?.granted ?? row?.Granted),
  grantedAt: pick(row, "grantedAt", "GrantedAt"),
  withdrawnAt: pick(row, "withdrawnAt", "WithdrawnAt"),
  manageLink: pick(row, "manageLink", "ManageLink"),
  status: pick(row, "status", "Status") || "",
  grantedNoticeVersion: pick(row, "grantedNoticeVersion", "GrantedNoticeVersion"),
  currentNoticeVersion: pick(row, "currentNoticeVersion", "CurrentNoticeVersion"),
  guardianRequired: Boolean(row?.guardianRequired ?? row?.GuardianRequired),
  guardianName: pick(row, "guardianName", "GuardianName"),
});

const normalizeDocument = (row, index) => ({
  id: pick(row, "documentId", "DocumentId", "secureDocumentId", "SecureDocumentId", "id") || `doc${index}`,
  fileName: pick(row, "fileName", "FileName") || "Document",
  mime: pick(row, "mime", "Mime") || "",
  at: pick(row, "createdAt", "CreatedAt"),
});

const SECTION_LABELS = ["timeline", "follow-ups", "diary", "progress", "consents", "profile", "documents"];

const readAuthProfile = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    return user.data || user;
  } catch (_) {
    return {};
  }
};

const normalizeProfile = (raw) => {
  const source = { ...readAuthProfile(), ...(raw || {}) };
  const name =
    pick(source, "fullName", "FullName", "patientName", "PatientName") ||
    [pick(source, "firstName", "FirstName"), pick(source, "lastName", "LastName")].filter(Boolean).join(" ") ||
    pick(source, "userName", "UserName") ||
    "Patient";
  const dob = pick(source, "dateOfBirth", "DateOfBirth", "dob", "Dob");
  const age = pick(source, "age", "Age") || (dob ? moment().diff(moment(dob), "years") : null);
  const toList = (value) =>
    Array.isArray(value) ? value : String(value || "").split(/[,;]/).map((item) => item.trim()).filter(Boolean);
  return {
    name,
    gender: pick(source, "gender", "Gender") || "",
    age,
    mobile: pick(source, "mobileNo", "MobileNo", "mobile", "phoneNumber", "PhoneNumber") || "—",
    email: pick(source, "email", "Email") || "—",
    bloodGroup: pick(source, "bloodGroup", "BloodGroup") || "—",
    city: pick(source, "city", "City", "address", "Address") || "—",
    allergies: toList(pick(source, "allergies", "Allergies")),
    conditions: toList(pick(source, "chronicConditions", "ChronicConditions", "medicalHistory", "MedicalHistory")),
  };
};

const PconCard = ({ icon, title, extra, className = "", children }) => (
  <section className={`prx-card pcon-card ${className}`.trim()}>
    <div className="prx-card__head">
      <h5 className="prx-card__title">
        <i className={icon} aria-hidden="true" />
        {title}
      </h5>
      {extra}
    </div>
    <div className="prx-card__body">{children}</div>
  </section>
);

/**
 * CON patient continuity — health timeline, consent centre, profile, follow-ups, diary and progress.
 */
const PatientContinuityPage = () => {
  document.title = "Care continuity | Niga Homeocentrum";

  const [timeline, setTimeline] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [diary, setDiary] = useState([]);
  const [progress, setProgress] = useState({ visits: 0, series: [] });
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && navigator.onLine === false);
  const [consents, setConsents] = useState([]);
  const [profile, setProfile] = useState(() => normalizeProfile(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [diarySeverity, setDiarySeverity] = useState(5);
  const [savingDiary, setSavingDiary] = useState(false);
  const [busyConsentId, setBusyConsentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [busyDocId, setBusyDocId] = useState("");
  const [partialError, setPartialError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setPartialError("");
    const results = await Promise.allSettled([
      getPatientTimeline(),
      getPatientFollowUps(),
      getPatientDiary(),
      getPatientProgress(),
      getPatientConsents(),
      getPatientProfileS4(),
      listPatientDocuments(),
    ]);
    const value = (index) => (results[index].status === "fulfilled" ? unwrapS4(results[index].value) : null);

    const events = normalizeTimeline(value(0));
    setTimeline(events);

    const tasks = asList(value(1)).map(normalizeFollowUp);
    setFollowUps(tasks);

    const entries = asList(value(2)).map(normalizeDiary);
    setDiary(entries);

    const rawProgress = value(3);
    const series = (pick(rawProgress, "series", "Series") || [])
      .map((row) => Number(pick(row, "severity", "Severity")))
      .filter((n) => Number.isFinite(n));
    setProgress({ visits: Number(pick(rawProgress, "visitCount", "VisitCount") || 0), series });

    const consentRows = asList(value(4)).map(normalizeConsent);
    setConsents(consentRows);

    setProfile(normalizeProfile(value(5)));
    setDocuments(asList(value(6)).map(normalizeDocument));

    const failed = results
      .map((row, index) => (row.status === "rejected" ? SECTION_LABELS[index] : null))
      .filter(Boolean);
    if (failed.length === results.length) {
      setError(`Could not load your care records. ${s4Message(results[0].reason)}`);
    } else if (failed.length) {
      setPartialError(`Some sections could not load: ${failed.join(", ")}. Refresh to try again.`);
    }
    setLoading(false);
  };

  const loadDocuments = async () => {
    try {
      setDocuments(asList(unwrapS4(await listPatientDocuments())).map(normalizeDocument));
    } catch (err) {
      setError(s4Message(err));
    }
  };

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    load();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const sortedTimeline = useMemo(
    () => [...timeline].sort((a, b) => String(b.at || "").localeCompare(String(a.at || ""))),
    [timeline]
  );

  const nextFollowUp = useMemo(
    () =>
      followUps
        .filter((task) => !task.done && task.due)
        .sort((a, b) => String(a.due).localeCompare(String(b.due)))[0] || null,
    [followUps]
  );

  const openTasks = followUps.filter((task) => !task.done).length;
  const firstSeverity = progress.series[0];
  const lastSeverity = progress.series[progress.series.length - 1];
  const improvement =
    firstSeverity > 0 ? Math.max(0, Math.min(100, Math.round(((firstSeverity - lastSeverity) / firstSeverity) * 100))) : 0;
  const maxSeverity = Math.max(...progress.series, 10);

  const onCompleteTask = async (task) => {
    try {
      await completeFollowUp(task.id);
      setFollowUps((prev) => prev.map((row) => (row.id === task.id ? { ...row, done: true } : row)));
    } catch (err) {
      setError(s4Message(err));
    }
  };

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. The limit is 10 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await uploadPatientDocument(file);
      Swal.fire({ title: "Document saved", icon: "success", timer: 1200, showConfirmButton: false });
      await loadDocuments();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setUploading(false);
    }
  };

  const onOpenDocument = async (doc) => {
    setBusyDocId(doc.id);
    setError("");
    try {
      const response = await openPatientDocument(doc.id);
      const blob = response?.data instanceof Blob ? response.data : response;
      if (!(blob instanceof Blob)) throw new Error("Could not open the document.");
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, "_blank");
      if (!opened) {
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyDocId("");
    }
  };

  const onDeleteDocument = async (doc) => {
    const result = await Swal.fire({
      title: "Delete document?",
      text: `${doc.fileName} will be removed permanently.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    setBusyDocId(doc.id);
    setError("");
    try {
      await deletePatientDocument(doc.id);
      setDocuments((prev) => prev.filter((row) => row.id !== doc.id));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyDocId("");
    }
  };

  const onSaveDiary = async () => {
    const note = diaryText.trim();
    if (!note) return;
    setSavingDiary(true);
    setError("");
    try {
      await postDiaryEntry({ entryDate: new Date().toISOString(), severity: Number(diarySeverity), note });
      setDiaryText("");
      setDiary((prev) => [
        { id: `new-${Date.now()}`, note, severity: Number(diarySeverity), at: new Date().toISOString() },
        ...prev,
      ]);
      Swal.fire({ title: "Diary entry saved", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSavingDiary(false);
    }
  };

  const onGiveConsent = async (consent) => {
    setBusyConsentId(consent.id);
    setError("");
    try {
      const response = await grantPatientConsent(consent.typeId);
      const data = response?.data ?? {};
      setConsents((prev) =>
        prev.map((row) =>
          row.id === consent.id
            ? {
                ...row,
                granted: true,
                status: "Valid",
                grantedNoticeVersion: row.currentNoticeVersion,
                recordId: data.consentRecordId ?? data.ConsentRecordId ?? row.recordId,
                grantedAt: data.grantedAt ?? data.GrantedAt ?? new Date().toISOString(),
                withdrawnAt: null,
              }
            : row
        )
      );
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyConsentId("");
    }
  };

  const onWithdrawConsent = async (consent) => {
    const result = await Swal.fire({
      title: "Withdraw consent?",
      text: `${consent.title} will stop from now on.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Withdraw",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    setBusyConsentId(consent.id);
    setError("");
    try {
      if (!consent.recordId) throw new Error("Consent record not found.");
      await withdrawConsent(consent.recordId);
      setConsents((prev) =>
        prev.map((row) =>
          row.id === consent.id ? { ...row, granted: false, recordId: null, withdrawnAt: new Date().toISOString() } : row
        )
      );
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyConsentId("");
    }
  };

  const onRequestData = async () => {
    const result = await Swal.fire({
      title: "Request a copy of your data?",
      text: "We will prepare your records and notify you when they are ready to download.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send request",
      confirmButtonColor: "#25a0e2",
    });
    if (!result.isConfirmed) return;
    try {
      await postDataRequest({ requestType: "Export" });
      Swal.fire({ title: "Request sent", icon: "success", timer: 1400, showConfirmButton: false });
    } catch (err) {
      setError(s4Message(err));
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page prx-page pcon-page">
      <Container fluid>
        <div className="prx-page__header">
          <div>
            <h2 className="clinic-page-title">Care continuity</h2>
            <p className="clinic-page-subtitle">Your health timeline, consents, profile, follow-ups and progress in one place.</p>
          </div>
        </div>

        {offline ? <Alert color="warning">You appear to be offline. Records will load when the connection returns.</Alert> : null}
        {error ? <Alert color="danger" toggle={() => setError("")}>{error}</Alert> : null}
        {partialError ? <Alert color="warning" toggle={() => setPartialError("")}>{partialError}</Alert> : null}

        {loading ? (
          <div className="prx-empty">
            <Spinner size="sm" />
            <span>Loading your records…</span>
          </div>
        ) : (
          <>
            <div className="prx-stats">
              <div className="prx-stat">
                <span className="prx-stat__icon"><i className="ri-stethoscope-line" aria-hidden="true" /></span>
                <div><strong>{progress.visits || sortedTimeline.filter((e) => e.type === "appointment").length}</strong><span>Visits</span></div>
              </div>
              <div className="prx-stat prx-stat--info">
                <span className="prx-stat__icon"><i className="ri-calendar-check-line" aria-hidden="true" /></span>
                <div><strong>{nextFollowUp ? formatDate(nextFollowUp.due, "DD MMM") : "—"}</strong><span>Next follow-up</span></div>
              </div>
              <div className="prx-stat prx-stat--warning">
                <span className="prx-stat__icon"><i className="ri-task-line" aria-hidden="true" /></span>
                <div><strong>{openTasks}</strong><span>Open tasks</span></div>
              </div>
              <div className="prx-stat prx-stat--success">
                <span className="prx-stat__icon"><i className="ri-line-chart-line" aria-hidden="true" /></span>
                <div><strong>{improvement}%</strong><span>Improvement</span></div>
              </div>
            </div>

            <div className="pcon-grid">
              <PconCard
                icon="ri-time-line"
                title="My Health Timeline"
                extra={<span className="pcon-count">{sortedTimeline.length} events</span>}
              >
                {sortedTimeline.length === 0 ? <p className="pcon-hint">No visits, prescriptions, or diary events yet.</p> : null}
                <ol className="pcon-timeline">
                  {sortedTimeline.map((event) => {
                    const meta = TIMELINE_META[event.type] || TIMELINE_META.appointment;
                    return (
                      <li key={event.id} className={`pcon-timeline__item pcon-tone--${meta.tone}`}>
                        <span className="pcon-timeline__dot">
                          <i className={meta.icon} aria-hidden="true" />
                        </span>
                        <div className="pcon-timeline__body">
                          <div className="pcon-timeline__top">
                            <span className="pcon-timeline__date">{formatDate(event.at)}</span>
                            <span className="pcon-timeline__type">{meta.label}</span>
                          </div>
                          <strong>{event.title}</strong>
                          {event.summary ? <span>{event.summary}</span> : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </PconCard>

              <PconCard
                icon="ri-shield-user-line"
                title="Consent Centre"
                extra={
                  <button type="button" className="pcon-link-btn" onClick={onRequestData}>
                    <i className="ri-download-cloud-2-line" aria-hidden="true" />
                    Request my data
                  </button>
                }
              >
                {consents.length === 0 ? <p className="pcon-hint">No consent records yet.</p> : null}
                <ul className="pcon-consents">
                  {consents.map((consent) => (
                    <li key={consent.id} className={consent.granted ? "is-granted" : ""}>
                      <span className="pcon-consents__icon">
                        <i className={consent.granted ? "ri-shield-check-line" : "ri-shield-line"} aria-hidden="true" />
                      </span>
                      <div className="pcon-consents__main">
                        <div className="pcon-consents__top">
                          <strong>{consent.title}</strong>
                          {consent.granted ? (
                            <span className="prx-chip prx-chip--signed">
                              <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                              Given
                            </span>
                          ) : (
                            <span className="prx-chip pcon-chip--off">Not given</span>
                          )}
                        </div>
                        {consent.purpose ? <span>{consent.purpose}</span> : null}
                        {consent.granted && consent.grantedNoticeVersion ? (
                          <small className="text-muted">
                            Notice version {consent.grantedNoticeVersion}
                            {consent.guardianName ? ` · given by guardian ${consent.guardianName}` : ""}
                          </small>
                        ) : null}
                        {!consent.granted && consent.status === "NoticeChanged" ? (
                          <small className="text-warning">
                            The notice changed to version {consent.currentNoticeVersion}. Please consent again.
                          </small>
                        ) : null}
                        {consent.guardianRequired ? (
                          <small className="text-warning">
                            Under 18: a parent or guardian gives this consent from their Family page or at the clinic.
                          </small>
                        ) : null}
                        <div className="pcon-consents__actions">
                          {consent.manageLink ? (
                            <>
                              {consent.granted ? <small>Since {formatDate(consent.grantedAt)}</small> : null}
                              <Link to={consent.manageLink} className="pcon-link-btn">
                                Manage
                              </Link>
                            </>
                          ) : consent.granted ? (
                            <>
                              <small>Since {formatDate(consent.grantedAt)}</small>
                              <button
                                type="button"
                                className="pcon-link-btn pcon-link-btn--danger"
                                disabled={busyConsentId === consent.id}
                                onClick={() => onWithdrawConsent(consent)}
                              >
                                Withdraw
                              </button>
                            </>
                          ) : (
                            <>
                            {consent.withdrawnAt ? <small>Withdrawn {formatDate(consent.withdrawnAt)}</small> : null}
                            <button
                              type="button"
                              className="prx-btn prx-btn--primary"
                              disabled={busyConsentId === consent.id || consent.guardianRequired}
                              onClick={() => onGiveConsent(consent)}
                            >
                              {busyConsentId === consent.id ? <Spinner size="sm" /> : <i className="ri-check-line" aria-hidden="true" />}
                              Give Consent
                            </button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </PconCard>

              <PconCard
                icon="ri-user-heart-line"
                title="My Profile"
                extra={
                  <Link to="/profile" className="pcon-link-btn">
                    <i className="ri-pencil-line" aria-hidden="true" />
                    Edit
                  </Link>
                }
              >
                <div className="pcon-profile">
                  <span className="pcon-profile__avatar" aria-hidden="true">
                    {profile.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0].toUpperCase())
                      .join("")}
                  </span>
                  <div>
                    <strong>{profile.name}</strong>
                    <span>{[profile.gender, profile.age ? `${profile.age} yrs` : ""].filter(Boolean).join(" · ") || "Patient"}</span>
                  </div>
                </div>
                <div className="pcon-subhead">
                  <i className="ri-user-3-line" aria-hidden="true" />
                  Personal Information
                </div>
                <dl className="pcon-facts">
                  <div><dt>Mobile</dt><dd>{profile.mobile}</dd></div>
                  <div><dt>Email</dt><dd>{profile.email}</dd></div>
                  <div><dt>Blood group</dt><dd>{profile.bloodGroup}</dd></div>
                  <div><dt>City</dt><dd>{profile.city}</dd></div>
                </dl>
                <div className="pcon-subhead">
                  <i className="ri-health-book-line" aria-hidden="true" />
                  Medical History
                </div>
                <div className="pcon-history">
                  <div>
                    <span>Allergies</span>
                    <div className="pcon-tags">
                      {profile.allergies.length ? profile.allergies.map((item) => <em key={item}>{item}</em>) : <small>None recorded</small>}
                    </div>
                  </div>
                  <div>
                    <span>Conditions</span>
                    <div className="pcon-tags">
                      {profile.conditions.length ? profile.conditions.map((item) => <em key={item}>{item}</em>) : <small>None recorded</small>}
                    </div>
                  </div>
                </div>
              </PconCard>

              <PconCard
                icon="ri-calendar-check-line"
                title="Follow-up Tasks"
                extra={<span className="pcon-count">{openTasks} open</span>}
              >
                <p className="pcon-hint">Your doctor adds these after a visit. Mark each one done when completed.</p>
                {followUps.length === 0 ? <p className="pcon-hint">No follow-up tasks yet.</p> : null}
                <ul className="pcon-tasks">
                  {followUps.map((task) => (
                    <li key={task.id} className={task.done ? "is-done" : ""}>
                      <i className={task.done ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"} aria-hidden="true" />
                      <div>
                        <strong>{task.title}</strong>
                        {task.due ? <span>Due {formatDate(task.due)}</span> : null}
                      </div>
                      {!task.done ? (
                        <button type="button" className="prx-btn pcon-soft-btn" onClick={() => onCompleteTask(task)}>
                          Done
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </PconCard>

              <PconCard
                icon="ri-attachment-2"
                title="Documents"
                extra={<span className="pcon-count">{documents.length} file{documents.length === 1 ? "" : "s"}</span>}
              >
                <p className="pcon-hint">Upload a report or photo for your treating doctor. PDF, JPG, or PNG up to 10 MB.</p>
                <label className="prx-btn prx-btn--primary">
                  {uploading ? <Spinner size="sm" /> : <i className="ri-upload-2-line" aria-hidden="true" />}
                  {uploading ? " Uploading…" : " Upload document"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={onUpload} disabled={uploading} />
                </label>
                {documents.length === 0 ? (
                  <p className="pcon-hint mt-2">No documents uploaded yet.</p>
                ) : (
                  <ul className="list-unstyled mt-3 mb-0">
                    {documents.map((doc) => (
                      <li key={doc.id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                        <i
                          className={/pdf/i.test(doc.mime) ? "ri-file-pdf-line text-danger" : "ri-image-line text-primary"}
                          aria-hidden="true"
                        />
                        <div className="flex-grow-1 text-truncate">
                          <div className="text-truncate">{doc.fileName}</div>
                          <small className="text-muted">{formatDate(doc.at, "DD MMM YYYY, hh:mm A")}</small>
                        </div>
                        <button
                          type="button"
                          className="pcon-link-btn"
                          disabled={busyDocId === doc.id}
                          onClick={() => onOpenDocument(doc)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="pcon-link-btn pcon-link-btn--danger"
                          disabled={busyDocId === doc.id}
                          onClick={() => onDeleteDocument(doc)}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </PconCard>

              <PconCard icon="ri-heart-pulse-line" title="Symptom Diary">
                <div className="pcon-diary-form">
                  <div className="pcon-severity">
                    <span>How severe today?</span>
                    <strong className={diarySeverity >= 7 ? "is-high" : diarySeverity >= 4 ? "is-mid" : "is-low"}>
                      {diarySeverity}/10
                    </strong>
                  </div>
                  <input
                    type="range"
                    className="form-range pcon-range"
                    min={0}
                    max={10}
                    value={diarySeverity}
                    onChange={(e) => setDiarySeverity(Number(e.target.value))}
                  />
                  <Input
                    type="textarea"
                    className="pcon-diary-input"
                    value={diaryText}
                    onChange={(e) => setDiaryText(e.target.value)}
                    placeholder="How are you feeling today?"
                  />
                  <button
                    type="button"
                    className="prx-btn prx-btn--primary"
                    disabled={!diaryText.trim() || savingDiary}
                    onClick={onSaveDiary}
                  >
                    {savingDiary ? <Spinner size="sm" /> : <i className="ri-save-line" aria-hidden="true" />}
                    Save entry
                  </button>
                </div>
                {diary.length === 0 ? <p className="pcon-hint">No diary entries yet.</p> : null}
                <ul className="pcon-diary">
                  {diary.slice(0, 4).map((entry) => (
                    <li key={entry.id}>
                      <span className={`pcon-diary__score ${entry.severity >= 7 ? "is-high" : entry.severity >= 4 ? "is-mid" : "is-low"}`}>
                        {entry.severity ?? "—"}
                      </span>
                      <div>
                        <strong>{entry.note}</strong>
                        <span>{formatDate(entry.at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </PconCard>

              <PconCard icon="ri-line-chart-line" title="Progress">
                <div className="pcon-progress__head">
                  <span>Overall improvement</span>
                  <strong>{improvement}%</strong>
                </div>
                <div className="pcon-progress__bar">
                  <span style={{ width: `${improvement}%` }} />
                </div>
                <div className="pcon-progress__stats">
                  <div><strong>{progress.visits || "—"}</strong><span>Visits</span></div>
                  <div><strong>{firstSeverity ?? "—"}</strong><span>Start severity</span></div>
                  <div><strong>{lastSeverity ?? "—"}</strong><span>Now</span></div>
                </div>
                <div className="pcon-subhead">
                  <i className="ri-bar-chart-2-line" aria-hidden="true" />
                  Severity trend
                </div>
                {progress.series.length === 0 ? <p className="pcon-hint">Progress appears after diary entries are saved.</p> : null}
                <div className="pcon-bars">
                  {progress.series.map((value, index) => (
                    <div key={index} className="pcon-bars__col">
                      <span className="pcon-bars__bar" style={{ height: `${(value / maxSeverity) * 100}%` }} />
                      <small>{index + 1}</small>
                    </div>
                  ))}
                </div>
              </PconCard>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default PatientContinuityPage;
