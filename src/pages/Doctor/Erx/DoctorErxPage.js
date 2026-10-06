import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Col, Container, Input, Row, Spinner } from "reactstrap";
import Swal from "sweetalert2";
import moment from "moment";

import {
  approveErxRefill,
  erxByAppointment,
  erxHistory,
  erxPdf,
  listErxRefills,
  rejectErxRefill,
  s4Message,
  signErx,
  unwrapS4,
  updateErxRemedyLine,
} from "../../../helpers/s4Week4Api";
import { getAppointmentList } from "../../../helpers/realbackend_helper";
import { DURATION_OPTIONS, FREQUENCY_OPTIONS, INSTRUCTION_OPTIONS, formatDosage } from "./erxOptions";
import "./doctorErx.css";

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const asSnapshot = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.items || payload.Items || payload.erxSnapshotId || payload.ErxSnapshotId) return payload;
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
};

const asList = (payload) => {
  const data = unwrapS4(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
};

const readAuthUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("authUser") || "{}");
  } catch (_) {
    return {};
  }
};

const getDoctorName = () => {
  const user = readAuthUser();
  const source = user.data || user;
  const full =
    source.fullName ||
    source.FullName ||
    [source.firstName || source.FirstName, source.lastName || source.LastName].filter(Boolean).join(" ");
  return full ? `Dr. ${String(full).replace(/^Dr\.?\s*/i, "")}` : "Doctor";
};

const formatDate = (value, format = "DD MMM YYYY") => (value ? moment(value).format(format) : "—");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const NOTE_TABS = [
  { id: "chief", label: "Chief Complaint" },
  { id: "followUp", label: "Follow-up" },
  { id: "general", label: "General" },
];

const lineIdOf = (row) =>
  pick(
    row,
    "remedyLineId",
    "RemedyLineId",
    "prescriptionRemedyDetailId",
    "PrescriptionRemedyDetailId",
    "erxSnapshotItemId",
    "ErxSnapshotItemId"
  );

const ErxCard = ({ icon, title, extra, children }) => (
  <div className="erx-card h-100">
    <div className="erx-card__head">
      <h5 className="erx-card__title">
        <i className={icon} aria-hidden="true" />
        {title}
      </h5>
      {extra}
    </div>
    <div className="erx-card__body">{children}</div>
  </div>
);

const NOT_SIGNED_PATTERN = /not (been )?signed|no (signed )?erx|not found/i;

/**
 * ERX — prescription lines, dosage, notes, sign & lock, record, print / download, history and refill inbox.
 */
const DoctorErxPage = () => {
  const [searchParams] = useSearchParams();
  const [patientAppId, setPatientAppId] = useState(() => searchParams.get("patientAppId") || "");
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [visits, setVisits] = useState([]);
  const [lineDrafts, setLineDrafts] = useState({});
  const [savingLineId, setSavingLineId] = useState(null);
  const [noteTab, setNoteTab] = useState("chief");
  const [notes, setNotes] = useState({ chief: "", followUp: "", general: "" });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [refills, setRefills] = useState([]);
  const [refillsLoading, setRefillsLoading] = useState(true);
  const [busyRefillId, setBusyRefillId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [unsignedVisitId, setUnsignedVisitId] = useState("");

  const doctorName = useMemo(getDoctorName, []);

  document.title = "Digital Prescription | Niga Homeocentrum";

  const load = useCallback(
    async (idOverride) => {
      const raw = idOverride != null && typeof idOverride !== "object" ? idOverride : patientAppId;
      const id = Number(raw);
      if (!id) {
        setError("Select a visit or enter a visit id.");
        return;
      }
      setLoading(true);
      setError("");
      setUnsignedVisitId("");
      try {
        const response = await erxByAppointment(id);
        const next = asSnapshot(unwrapS4(response));
        setSnapshot(next);
        setLineDrafts({});
      } catch (err) {
        setSnapshot(null);
        const message = s4Message(err);
        if (NOT_SIGNED_PATTERN.test(message)) setUnsignedVisitId(String(id));
        else setError(message);
      } finally {
        setLoading(false);
      }
    },
    [patientAppId]
  );

  const loadHistory = () => {
    setHistoryLoading(true);
    erxHistory()
      .then((response) => setHistory(asList(response)))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  const loadRefills = () => {
    setRefillsLoading(true);
    listErxRefills("ALL")
      .then((response) => setRefills(asList(response)))
      .catch(() => setRefills([]))
      .finally(() => setRefillsLoading(false));
  };

  useEffect(() => {
    const fromQuery = Number(searchParams.get("patientAppId"));
    if (fromQuery > 0) {
      setPatientAppId(String(fromQuery));
      load(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    loadHistory();
    loadRefills();
    const user = readAuthUser();
    const userId = user.userId || user.UserId || user.data?.userId || user.id || "";
    if (!userId) return undefined;
    let cancelled = false;
    getAppointmentList({ userId, appointmentDate: new Date().toISOString() })
      .then((response) => {
        const body = response?.data ?? response;
        const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        if (!cancelled) setVisits(list);
      })
      .catch(() => {
        if (!cancelled) setVisits([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visitIdOf = (row) =>
    row?.patientAppId || row?.patientAppID || row?.PatientAppId || row?.appointmentId || row?.AppointmentId || "";

  const visitPatientName = (row) => row?.patientName || row?.PatientName || row?.name || row?.fullName || "Patient";

  const visitLabel = (row) => {
    const time = row?.appointmentTime || row?.AppointmentTime || row?.time || "";
    return `${visitPatientName(row)}${time ? ` · ${time}` : ""} · visit ${visitIdOf(row)}`;
  };

  const items = Array.isArray(snapshot?.items) ? snapshot.items : Array.isArray(snapshot?.Items) ? snapshot.Items : [];
  const erxId = pick(snapshot, "erxSnapshotId", "ErxSnapshotId", "erxId", "ErxId");
  const status = pick(snapshot, "status", "Status") || (snapshot ? "Draft" : "");
  const signedAt = pick(snapshot, "signedAt", "SignedAt");
  const isLocked = Boolean(signedAt) || /signed|locked/i.test(status || "");
  const isUnsigned = !snapshot && Boolean(unsignedVisitId) && unsignedVisitId === String(patientAppId);
  const visitLoaded = Boolean(snapshot) || isUnsigned;
  const selectedVisit = visits.find((row) => String(visitIdOf(row)) === String(patientAppId));
  const patientName =
    pick(snapshot, "patientName", "PatientName") || (selectedVisit ? visitPatientName(selectedVisit) : "—");

  const draftFor = (row) => {
    const id = lineIdOf(row);
    return (
      lineDrafts[id] || {
        frequency: pick(row, "frequency", "Frequency") || "",
        duration: pick(row, "duration", "Duration") || "",
        instructions: pick(row, "instructions", "Instructions") || "",
      }
    );
  };

  const updateDraft = (row, field, value) => {
    const id = lineIdOf(row);
    setLineDrafts((prev) => ({ ...prev, [id]: { ...draftFor(row), [field]: value } }));
  };

  const saveLine = async (row) => {
    const id = lineIdOf(row);
    if (!id) {
      setError("This remedy line has no id, so the dosage cannot be saved.");
      return;
    }
    setSavingLineId(id);
    setError("");
    try {
      await updateErxRemedyLine(id, draftFor(row));
      Swal.fire({ title: "Dosage saved", icon: "success", timer: 1200, showConfirmButton: false });
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSavingLineId(null);
    }
  };

  const onSign = async () => {
    const id = Number(patientAppId);
    const missingPotency = items.filter((row) => !pick(row, "potencyCode", "PotencyCode"));
    if (missingPotency.length) {
      Swal.fire({ title: "Potency missing", text: "Every remedy needs a potency before signing.", icon: "warning" });
      return;
    }
    const result = await Swal.fire({
      title: "Sign & lock this prescription?",
      text: "After signing, the prescription cannot be edited.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sign & Lock",
      confirmButtonColor: "#25a0e2",
    });
    if (!result.isConfirmed) return;
    setSigning(true);
    setError("");
    try {
      await signErx({ patientAppId: id });
      Swal.fire({ title: "Signed & locked", icon: "success", timer: 1400, showConfirmButton: false });
      await load();
      loadHistory();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSigning(false);
    }
  };

  const onDownload = async () => {
    if (!erxId) return;
    setDownloading(true);
    setError("");
    try {
      const response = await erxPdf(erxId);
      const blob = response?.data instanceof Blob ? response.data : response;
      if (!(blob instanceof Blob)) throw new Error("The server did not return a PDF.");
      if (blob.type && blob.type.includes("json")) {
        const payload = JSON.parse(await blob.text());
        const url = pick(payload?.data || payload, "url", "Url", "pdfUrl", "PdfUrl", "fileUrl", "FileUrl");
        if (!url) throw new Error(payload?.message || "The server did not return a PDF.");
        window.open(url, "_blank", "noopener");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eRx-${erxId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setDownloading(false);
    }
  };

  const onPrint = () => {
    if (!snapshot) return;
    const rows = items
      .map(
        (row, index) => `<tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(pick(row, "remedyName", "RemedyName", "remedyCode", "RemedyCode") || "—")}</td>
          <td>${escapeHtml(pick(row, "potencyCode", "PotencyCode") || "—")}</td>
          <td>${escapeHtml(formatDosage(draftFor(row)) || pick(row, "dose", "Dose") || "—")}</td>
        </tr>`
      )
      .join("");
    const noteBlocks = NOTE_TABS.filter((tab) => notes[tab.id].trim())
      .map((tab) => `<p><strong>${tab.label}:</strong> ${escapeHtml(notes[tab.id])}</p>`)
      .join("");
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) {
      setError("Allow pop-ups to print the prescription.");
      return;
    }
    win.document.write(`<!doctype html><html><head><title>eRx ${escapeHtml(erxId || "")}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;margin:32px}
        h1{font-size:20px;margin:0;color:#25a0e2}
        .meta{display:flex;justify-content:space-between;font-size:13px;margin:16px 0;padding:10px 0;border-top:2px solid #25a0e2;border-bottom:1px solid #e2e8f0}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
        th{background:#f1f8fd}
        .notes{font-size:13px;margin-top:16px}
        .sign{margin-top:48px;text-align:right;font-size:13px}
        .sign span{display:inline-block;border-top:1px solid #0f172a;padding-top:4px;min-width:180px;text-align:center}
      </style></head><body>
      <h1>Niga Homeocentrum · Digital Prescription</h1>
      <div class="meta">
        <div><strong>Patient:</strong> ${escapeHtml(patientName)}<br/><strong>Visit:</strong> ${escapeHtml(patientAppId)}</div>
        <div><strong>eRx:</strong> ${escapeHtml(erxId || "—")}<br/><strong>Date:</strong> ${escapeHtml(formatDate(signedAt || new Date()))}</div>
      </div>
      <table><thead><tr><th>#</th><th>Remedy</th><th>Potency</th><th>Dosage</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No remedies</td></tr>'}</tbody></table>
      ${noteBlocks ? `<div class="notes">${noteBlocks}</div>` : ""}
      <div class="sign"><span>${escapeHtml(doctorName)}${isLocked ? " · Digitally signed" : ""}</span></div>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const decideRefill = async (row, approve) => {
    const id = pick(row, "refillRequestId", "RefillRequestId", "erxRefillId", "ErxRefillId", "refillId", "RefillId", "id", "Id");
    if (!id) return;
    let note = "";
    if (!approve) {
      const result = await Swal.fire({
        title: "Reject refill request?",
        input: "text",
        inputPlaceholder: "Reason (required)",
        showCancelButton: true,
        confirmButtonText: "Reject",
        confirmButtonColor: "#dc3545",
        inputValidator: (value) => (!value?.trim() ? "Reason is required." : undefined),
      });
      if (!result.isConfirmed) return;
      note = result.value.trim();
    }
    setBusyRefillId(id);
    setError("");
    try {
      if (approve) await approveErxRefill(id);
      else await rejectErxRefill(id, { reason: note });
      Swal.fire({ title: approve ? "Refill approved" : "Refill rejected", icon: "success", timer: 1200, showConfirmButton: false });
      loadRefills();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyRefillId(null);
    }
  };

  const openFromHistory = (row) => {
    const id = pick(row, "patientAppId", "PatientAppId", "appointmentId", "AppointmentId");
    if (!id) return;
    setPatientAppId(String(id));
    load(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pendingRefills = refills.filter((row) => !/approved|rejected/i.test(pick(row, "status", "Status") || ""));

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page erx-page">
      <Container fluid>
        <div className="erx-page__header">
          <div>
            <h2 className="clinic-page-title mb-1">Digital Prescription</h2>
            <p className="clinic-page-subtitle mb-0">Review remedies, set dosage, sign & lock, then print or download the eRx.</p>
          </div>
          <div className="erx-page__picker">
            <Input
              type="select"
              bsSize="sm"
              value={selectedVisit ? String(patientAppId) : ""}
              onChange={(e) => {
                setPatientAppId(e.target.value);
                if (e.target.value) load(e.target.value);
              }}
            >
              <option value="">{visits.length ? "Today's visits" : "No visits today"}</option>
              {visits.map((row) => {
                const id = visitIdOf(row);
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {visitLabel(row)}
                  </option>
                );
              })}
            </Input>
            <Input
              type="number"
              bsSize="sm"
              min={1}
              placeholder="Visit id"
              className="erx-page__visit-id"
              value={patientAppId}
              onChange={(e) => setPatientAppId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <button type="button" className="btn btn-sm erx-btn erx-btn--primary" disabled={loading || !patientAppId} onClick={() => load()}>
              {loading ? <Spinner size="sm" /> : <i className="ri-refresh-line" aria-hidden="true" />}
              Load
            </button>
          </div>
        </div>

        {error ? (
          <Alert color="danger" className="py-2 small" toggle={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        {visitLoaded ? (
          <div className="erx-page__patient">
            <span className="erx-page__patient-avatar" aria-hidden="true">
              <i className="ri-user-heart-line" />
            </span>
            <div>
              <div className="erx-page__patient-name">{patientName}</div>
              <div className="erx-page__patient-meta">
                Visit {patientAppId} · eRx {erxId || "not created yet"}
              </div>
            </div>
            <span className={`erx-status ${isLocked ? "erx-status--signed" : "erx-status--draft"}`}>
              <i className={isLocked ? "ri-lock-line" : "ri-edit-2-line"} aria-hidden="true" />
              {isLocked ? "Signed & Locked" : isUnsigned ? "Not signed" : status || "Draft"}
            </span>
          </div>
        ) : null}

        <Row className="g-2">
          <Col xl={8}>
            <ErxCard
              icon="ri-capsule-line"
              title="Prescription & Dosage"
              extra={<span className="erx-card__hint">Potency & dosage</span>}
            >
              {isUnsigned ? (
                <div className="erx-empty erx-empty--info">
                  <i className="ri-quill-pen-line" aria-hidden="true" />
                  <strong>This visit is not signed yet.</strong>
                  Remedies saved on Patient Board appear here once you Sign &amp; Lock the prescription.
                </div>
              ) : !snapshot ? (
                <div className="erx-empty">
                  <i className="ri-file-search-line" aria-hidden="true" />
                  Pick a visit above to load its prescription.
                </div>
              ) : items.length === 0 ? (
                <div className="erx-empty">
                  <i className="ri-capsule-line" aria-hidden="true" />
                  No remedies on this prescription. Add them from Patient Board.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0 erx-table">
                    <thead>
                      <tr>
                        <th>Remedy</th>
                        <th>Potency</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                        {!isLocked ? <th className="text-end">Action</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, index) => {
                        const id = lineIdOf(row) || index;
                        const draft = draftFor(row);
                        const renderSelect = (field, options, placeholder) =>
                          isLocked ? (
                            <span className="erx-table__value">{draft[field] || "—"}</span>
                          ) : (
                            <Input
                              type="select"
                              bsSize="sm"
                              value={draft[field]}
                              onChange={(e) => updateDraft(row, field, e.target.value)}
                            >
                              <option value="">{placeholder}</option>
                              {options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </Input>
                          );
                        return (
                          <tr key={id}>
                            <td className="erx-table__remedy">
                              {pick(row, "remedyName", "RemedyName", "remedyCode", "RemedyCode") || "—"}
                            </td>
                            <td>
                              <span className="erx-potency">{pick(row, "potencyCode", "PotencyCode") || "—"}</span>
                            </td>
                            <td>{renderSelect("frequency", FREQUENCY_OPTIONS, "Frequency")}</td>
                            <td>{renderSelect("duration", DURATION_OPTIONS, "Duration")}</td>
                            <td>{renderSelect("instructions", INSTRUCTION_OPTIONS, "Instructions")}</td>
                            {!isLocked ? (
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm erx-btn erx-btn--soft"
                                  disabled={savingLineId === lineIdOf(row)}
                                  onClick={() => saveLine(row)}
                                >
                                  {savingLineId === lineIdOf(row) ? <Spinner size="sm" /> : <i className="ri-save-line" aria-hidden="true" />}
                                  Save
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ErxCard>
          </Col>

          <Col xl={4} md={6}>
            <ErxCard icon="ri-quill-pen-line" title="Sign Prescription">
              <div className="erx-sign">
                <div className={`erx-sign__pad${isLocked ? " is-signed" : ""}`}>
                  {isLocked ? (
                    <>
                      <span className="erx-sign__script">{doctorName}</span>
                      <span className="erx-sign__caption">Doctor Signature · {formatDate(signedAt, "DD MMM YYYY, hh:mm A")}</span>
                    </>
                  ) : (
                    <span className="erx-sign__placeholder">
                      <i className="ri-quill-pen-line" aria-hidden="true" />
                      Not signed yet
                    </span>
                  )}
                </div>
                {isLocked ? (
                  <span className="erx-lock-badge">
                    <i className="ri-lock-line" aria-hidden="true" />
                    Locked
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn erx-btn erx-btn--primary w-100"
                    disabled={!visitLoaded || signing}
                    onClick={onSign}
                  >
                    {signing ? <Spinner size="sm" /> : <i className="ri-lock-line" aria-hidden="true" />}
                    Sign & Lock
                  </button>
                )}
                <p className="erx-card__note mb-0">
                  {isLocked
                    ? "This prescription is locked. Remedies and dosage can no longer change."
                    : "Signing locks remedies and dosage. Every remedy needs a potency."}
                </p>
              </div>
            </ErxCard>
          </Col>

          <Col xl={4} md={6}>
            <ErxCard icon="ri-sticky-note-line" title="Clinical Notes">
              <div className="erx-tabs" role="tablist">
                {NOTE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={noteTab === tab.id}
                    className={`erx-tabs__tab${noteTab === tab.id ? " is-active" : ""}`}
                    onClick={() => setNoteTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Input
                type="textarea"
                className="erx-notes__input"
                placeholder="Enter notes..."
                value={notes[noteTab]}
                disabled={isLocked}
                onChange={(e) => setNotes((prev) => ({ ...prev, [noteTab]: e.target.value }))}
              />
              <p className="erx-card__note mb-0">
                Notes print on the eRx. History notes:{" "}
                <strong>{pick(snapshot, "notesIncluded", "NotesIncluded") ? "included" : "not included"}</strong>.
              </p>
            </ErxCard>
          </Col>

          <Col xl={4} md={6}>
            <ErxCard icon="ri-file-shield-2-line" title="Prescription Record">
              {isLocked ? (
                <div className="erx-record">
                  <span className="erx-record__check" aria-hidden="true">
                    <i className="ri-checkbox-circle-fill" />
                  </span>
                  <div className="erx-record__title">Prescription confirmed</div>
                  <dl className="erx-record__list">
                    <div>
                      <dt>eRx no.</dt>
                      <dd>{erxId || "—"}</dd>
                    </div>
                    <div>
                      <dt>Signed on</dt>
                      <dd>{formatDate(signedAt, "DD MMM YYYY, hh:mm A")}</dd>
                    </div>
                    <div>
                      <dt>Remedies</dt>
                      <dd>{items.length}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="erx-empty erx-empty--sm">
                  <i className="ri-file-shield-2-line" aria-hidden="true" />
                  The record is created once the prescription is signed.
                </div>
              )}
            </ErxCard>
          </Col>

          <Col xl={4} md={6}>
            <ErxCard icon="ri-printer-line" title="Print / Download Prescription">
              <div className="erx-actions">
                <button type="button" className="erx-action" disabled={!snapshot} onClick={onPrint}>
                  <i className="ri-printer-line" aria-hidden="true" />
                  Print
                </button>
                <button type="button" className="erx-action" disabled={!erxId || downloading} onClick={onDownload}>
                  {downloading ? <Spinner size="sm" /> : <i className="ri-download-2-line" aria-hidden="true" />}
                  Download
                </button>
              </div>
              <p className="erx-card__note mb-0">Download saves the signed PDF. Print opens a printable copy.</p>
            </ErxCard>
          </Col>

          <Col xl={6}>
            <ErxCard
              icon="ri-history-line"
              title="Prescription History"
              extra={
                <button type="button" className="erx-icon-btn" onClick={loadHistory} title="Refresh">
                  <i className="ri-refresh-line" aria-hidden="true" />
                </button>
              }
            >
              {historyLoading ? (
                <div className="erx-empty erx-empty--sm">
                  <Spinner size="sm" />
                </div>
              ) : history.length === 0 ? (
                <div className="erx-empty erx-empty--sm">
                  <i className="ri-history-line" aria-hidden="true" />
                  No signed prescriptions yet.
                </div>
              ) : (
                <ul className="erx-list">
                  {history.slice(0, 8).map((row, index) => {
                    const rowStatus = pick(row, "status", "Status") || (pick(row, "signedAt", "SignedAt") ? "Signed" : "Draft");
                    const signed = /signed|locked/i.test(rowStatus);
                    return (
                      <li className="erx-list__item" key={pick(row, "erxSnapshotId", "ErxSnapshotId") || index}>
                        <span className="erx-list__date">
                          {formatDate(pick(row, "signedAt", "SignedAt", "createdAt", "CreatedAt"))}
                        </span>
                        <span className="erx-list__main">
                          {pick(row, "patientName", "PatientName") || `Visit ${pick(row, "patientAppId", "PatientAppId") || "—"}`}
                          <small>eRx {pick(row, "erxSnapshotId", "ErxSnapshotId") || "—"}</small>
                        </span>
                        <span className={`erx-chip ${signed ? "erx-chip--success" : "erx-chip--muted"}`}>
                          <i className={signed ? "ri-checkbox-circle-line" : "ri-time-line"} aria-hidden="true" />
                          {signed ? "Signed" : rowStatus}
                        </span>
                        <button type="button" className="btn btn-sm erx-btn erx-btn--soft" onClick={() => openFromHistory(row)}>
                          View
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ErxCard>
          </Col>

          <Col xl={6}>
            <ErxCard
              icon="ri-inbox-line"
              title="eRx Inbox"
              extra={
                <span className="d-inline-flex align-items-center gap-2">
                  {pendingRefills.length ? <span className="erx-count">{pendingRefills.length} new</span> : null}
                  <button type="button" className="erx-icon-btn" onClick={loadRefills} title="Refresh">
                    <i className="ri-refresh-line" aria-hidden="true" />
                  </button>
                </span>
              }
            >
              {refillsLoading ? (
                <div className="erx-empty erx-empty--sm">
                  <Spinner size="sm" />
                </div>
              ) : refills.length === 0 ? (
                <div className="erx-empty erx-empty--sm">
                  <i className="ri-inbox-line" aria-hidden="true" />
                  No refill requests right now.
                </div>
              ) : (
                <ul className="erx-list">
                  {refills.slice(0, 8).map((row, index) => {
                    const id = pick(row, "refillRequestId", "RefillRequestId", "erxRefillId", "ErxRefillId", "refillId", "RefillId", "id", "Id") || index;
                    const rowStatus = pick(row, "status", "Status") || "Pending";
                    const decided = /approved|rejected/i.test(rowStatus);
                    return (
                      <li className="erx-list__item" key={id}>
                        <span className="erx-inbox__icon" aria-hidden="true">
                          <i className="ri-repeat-line" />
                        </span>
                        <span className="erx-list__main">
                          Refill Request
                          <small>
                            Patient: {pick(row, "patientName", "PatientName") || "—"}
                            {pick(row, "erxSnapshotId", "ErxSnapshotId") ? ` · eRx ${pick(row, "erxSnapshotId", "ErxSnapshotId")}` : ""}
                          </small>
                        </span>
                        <span className="erx-list__date">
                          {formatDate(pick(row, "requestedAt", "RequestedAt", "createdAt", "CreatedAt"), "DD MMM")}
                        </span>
                        {decided ? (
                          <span className={`erx-chip ${/approved/i.test(rowStatus) ? "erx-chip--success" : "erx-chip--danger"}`}>
                            {rowStatus}
                          </span>
                        ) : (
                          <span className="d-inline-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-soft-success erx-icon-action"
                              disabled={busyRefillId === id}
                              onClick={() => decideRefill(row, true)}
                              title="Approve"
                            >
                              <i className="ri-check-line" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-soft-danger erx-icon-action"
                              disabled={busyRefillId === id}
                              onClick={() => decideRefill(row, false)}
                              title="Reject"
                            >
                              <i className="ri-close-line" aria-hidden="true" />
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </ErxCard>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DoctorErxPage;
