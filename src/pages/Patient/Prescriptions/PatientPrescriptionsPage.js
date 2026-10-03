import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Container, Input, Spinner } from "reactstrap";
import Swal from "sweetalert2";
import moment from "moment";

import { erxHistory, erxPatient, erxPdf, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";
import { formatDosage } from "../../Doctor/Erx/erxOptions";
import OrderMedicinesModal from "../Medicine/OrderMedicinesModal";
import "./patientPrescriptions.css";

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const asList = (payload) => {
  const data = unwrapS4(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
};

const daysAgo = (days) => moment().subtract(days, "days").toISOString();

const SAMPLE_PRESCRIPTIONS = [
  {
    id: "sample-1",
    erxNo: "ERX-26-0142",
    doctorName: "Dr. Rohit Mehta",
    qualification: "BHMS, MD (Hom)",
    clinic: "Mehta Homeopathy Clinic, Pune",
    mode: "In-Clinic",
    date: daysAgo(2),
    signed: false,
    symptoms: ["Cold", "Sneezing", "Mild fever"],
    diagnosis: "Acute coryza",
    remedies: [
      { name: "Arsenicum Album", potency: "30C", frequency: "3 times a day", duration: "5 days", instructions: "After food" },
      { name: "Allium Cepa", potency: "6C", frequency: "SOS (when needed)", duration: "5 days", instructions: "Dissolve in water" },
    ],
    advice: ["Drink warm water", "Steam inhalation twice a day", "Avoid cold drinks"],
    followUp: daysAgo(-5),
  },
  {
    id: "sample-2",
    erxNo: "ERX-26-0128",
    doctorName: "Dr. Rohit Mehta",
    qualification: "BHMS, MD (Hom)",
    clinic: "Mehta Homeopathy Clinic, Pune",
    mode: "In-Clinic",
    date: daysAgo(9),
    signed: true,
    symptoms: ["Acidity", "Bloating", "Headache"],
    diagnosis: "Chronic gastritis",
    remedies: [
      { name: "Nux Vomica", potency: "30C", frequency: "3 times a day", duration: "2 weeks", instructions: "After food" },
      { name: "Carbo Vegetabilis", potency: "6X", frequency: "2 times a day", duration: "1 week", instructions: "Before food" },
    ],
    advice: ["Avoid spicy and oily food", "Limit tea and coffee", "Eat meals on time"],
    followUp: daysAgo(-14),
  },
  {
    id: "sample-3",
    erxNo: "ERX-26-0097",
    doctorName: "Dr. Anjali Deshmukh",
    qualification: "BHMS",
    clinic: "Tele Consultation",
    mode: "Tele Consultation",
    date: daysAgo(22),
    signed: true,
    symptoms: ["Skin rash", "Itching"],
    diagnosis: "Allergic dermatitis",
    remedies: [
      { name: "Sulphur", potency: "200C", frequency: "Once a week", duration: "1 month", instructions: "Empty stomach" },
      { name: "Graphites", potency: "30C", frequency: "2 times a day", duration: "2 weeks", instructions: "Avoid coffee & mint" },
    ],
    advice: ["Use mild, fragrance-free soap", "Wear loose cotton clothes"],
    followUp: daysAgo(8),
  },
  {
    id: "sample-4",
    erxNo: "ERX-26-0061",
    doctorName: "Dr. Sameer Kulkarni",
    qualification: "BHMS, MD (Hom)",
    clinic: "Kulkarni Wellness Centre, Mumbai",
    mode: "In-Clinic",
    date: daysAgo(45),
    signed: true,
    symptoms: ["Joint pain", "Morning stiffness"],
    diagnosis: "Osteoarthritis (knee)",
    remedies: [
      { name: "Rhus Toxicodendron", potency: "200C", frequency: "Once a day", duration: "1 month", instructions: "Empty stomach" },
      { name: "Bryonia Alba", potency: "30C", frequency: "2 times a day", duration: "2 weeks", instructions: "After food" },
      { name: "Calcarea Fluorica", potency: "6X", frequency: "3 times a day", duration: "1 month", instructions: "After food" },
    ],
    advice: ["Gentle knee exercises daily", "Warm compress in the morning"],
    followUp: daysAgo(15),
  },
  {
    id: "sample-5",
    erxNo: "ERX-26-0034",
    doctorName: "Dr. Neha Joshi",
    qualification: "BHMS, PGDHHM",
    clinic: "Tele Consultation",
    mode: "Tele Consultation",
    date: daysAgo(61),
    signed: false,
    symptoms: ["Anxiety", "Insomnia"],
    diagnosis: "Stress-related sleep disturbance",
    remedies: [
      { name: "Kali Phosphoricum", potency: "6X", frequency: "3 times a day", duration: "1 month", instructions: "After food" },
      { name: "Coffea Cruda", potency: "30C", frequency: "Once a day", duration: "2 weeks", instructions: "At bedtime" },
    ],
    advice: ["Keep a fixed sleep time", "No screens an hour before bed"],
    followUp: null,
  },
];

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "signed", label: "Signed" },
  { id: "unsigned", label: "Unsigned" },
];

const getInitials = (name) =>
  String(name || "D")
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const formatDate = (value, format = "DD MMM YYYY") => (value ? moment(value).format(format) : "—");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const readPatientName = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const source = user.data || user;
    return (
      source.fullName ||
      source.FullName ||
      [source.firstName || source.FirstName, source.lastName || source.LastName].filter(Boolean).join(" ") ||
      source.userName ||
      source.UserName ||
      "Patient"
    );
  } catch (_) {
    return "Patient";
  }
};

const normalizeRemedy = (row) => ({
  name: pick(row, "remedyName", "RemedyName", "remedyCode", "RemedyCode", "name") || "—",
  potency: pick(row, "potencyCode", "PotencyCode", "potency") || "",
  frequency: pick(row, "frequency", "Frequency") || "",
  duration: pick(row, "duration", "Duration") || "",
  instructions: pick(row, "instructions", "Instructions") || "",
});

const normalizeSymptoms = (row) => {
  const raw = pick(row, "symptoms", "Symptoms", "chiefComplaint", "ChiefComplaint", "complaints", "Complaints");
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

const normalizeErx = (row, index) => {
  const erxId = pick(row, "erxSnapshotId", "ErxSnapshotId", "erxId", "ErxId");
  const signedAt = pick(row, "signedAt", "SignedAt");
  const status = String(pick(row, "status", "Status") || "");
  const items = pick(row, "items", "Items", "remedies", "Remedies") || [];
  const doctor = pick(row, "doctorName", "DoctorName") || "Doctor";
  return {
    id: `erx-${erxId || index}`,
    erxId,
    erxNo: erxId ? `ERX-${erxId}` : "—",
    visitId: pick(row, "patientAppId", "PatientAppId"),
    doctorName: /^dr\.?\s/i.test(doctor) ? doctor : `Dr. ${doctor}`,
    qualification: pick(row, "qualification", "Qualification") || "",
    clinic: pick(row, "clinicName", "ClinicName") || "",
    mode: pick(row, "consultMode", "ConsultMode", "visitMode", "VisitMode") || "",
    date: signedAt || pick(row, "createdAt", "CreatedAt", "appointmentDate", "AppointmentDate"),
    signed: Boolean(signedAt) || /signed|locked/i.test(status),
    symptoms: normalizeSymptoms(row),
    diagnosis: pick(row, "diagnosis", "Diagnosis") || "",
    remedies: Array.isArray(items) ? items.map(normalizeRemedy) : [],
    advice: [],
    followUp: pick(row, "followUpDate", "FollowUpDate"),
    fromApi: true,
  };
};

const StatusChip = ({ signed }) =>
  signed ? (
    <span className="prx-chip prx-chip--signed">
      <i className="ri-checkbox-circle-fill" aria-hidden="true" />
      Signed
    </span>
  ) : (
    <span className="prx-chip prx-chip--unsigned">
      <i className="ri-time-line" aria-hidden="true" />
      Unsigned
    </span>
  );

/**
 * ERX-06.02 — patient prescription records: list across doctors, details, signed state and download.
 */
const PatientPrescriptionsPage = () => {
  document.title = "Digital Prescription | Niga Homeocentrum";

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [orderFor, setOrderFor] = useState(null);
  const navigate = useNavigate();

  const patientName = useMemo(readPatientName, []);

  const onOrderPlaced = async (order) => {
    setOrderFor(null);
    const result = await Swal.fire({
      title: "Order placed",
      text: `${order?.orderNo ? `Order ${order.orderNo} sent. ` : ""}The pharmacy will confirm stock and send you a quote.`,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "View My Orders",
      cancelButtonText: "Stay here",
      confirmButtonColor: "#25a0e2",
    });
    if (result.isConfirmed) navigate("/patient/medicine-orders");
  };

  useEffect(() => {
    let cancelled = false;
    erxHistory()
      .then((response) => {
        const rows = asList(response).map(normalizeErx);
        if (!cancelled) setPrescriptions(rows.length ? rows : SAMPLE_PRESCRIPTIONS);
      })
      .catch(() => {
        if (!cancelled) setPrescriptions(SAMPLE_PRESCRIPTIONS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const doctors = useMemo(
    () => Array.from(new Set(prescriptions.map((row) => row.doctorName))).sort(),
    [prescriptions]
  );

  const counts = useMemo(
    () => ({
      all: prescriptions.length,
      signed: prescriptions.filter((row) => row.signed).length,
      unsigned: prescriptions.filter((row) => !row.signed).length,
    }),
    [prescriptions]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prescriptions
      .filter((row) => {
        if (statusTab === "signed" && !row.signed) return false;
        if (statusTab === "unsigned" && row.signed) return false;
        if (doctorFilter && row.doctorName !== doctorFilter) return false;
        if (!query) return true;
        const haystack = [row.doctorName, row.erxNo, row.diagnosis, ...row.symptoms, ...row.remedies.map((r) => r.name)]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [prescriptions, search, statusTab, doctorFilter]);

  const selected = filtered.find((row) => row.id === selectedId) || filtered[0] || null;

  useEffect(() => {
    if (!selected?.fromApi || selected.remedies.length || !selected.visitId || selected.detailsLoaded) return;
    let cancelled = false;
    erxPatient(selected.visitId)
      .then((response) => {
        const data = unwrapS4(response) || {};
        const detail = normalizeErx({ ...data, erxSnapshotId: selected.erxId, signedAt: data.signedAt || selected.date }, 0);
        if (cancelled) return;
        setPrescriptions((prev) =>
          prev.map((row) =>
            row.id === selected.id
              ? {
                  ...row,
                  remedies: detail.remedies,
                  symptoms: row.symptoms.length ? row.symptoms : detail.symptoms,
                  diagnosis: row.diagnosis || detail.diagnosis,
                  detailsLoaded: true,
                }
              : row
          )
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPrescriptions((prev) => prev.map((row) => (row.id === selected.id ? { ...row, detailsLoaded: true } : row)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const printPrescription = (row) => {
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) {
      setError("Allow pop-ups to download the prescription.");
      return;
    }
    const remedyRows = row.remedies
      .map(
        (remedy, index) => `<tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(remedy.name)}</td>
          <td>${escapeHtml(remedy.potency || "—")}</td>
          <td>${escapeHtml(formatDosage(remedy) || "—")}</td>
        </tr>`
      )
      .join("");
    const advice = row.advice.length
      ? `<p><strong>Advice:</strong> ${row.advice.map(escapeHtml).join(" · ")}</p>`
      : "";
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(row.erxNo)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;margin:32px}
        h1{font-size:20px;margin:0;color:#25a0e2}
        .meta{display:flex;justify-content:space-between;font-size:13px;margin:16px 0;padding:10px 0;border-top:2px solid #25a0e2;border-bottom:1px solid #e2e8f0}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
        th{background:#f1f8fd}
        .notes{font-size:13px;margin-top:16px}
        .sign{margin-top:48px;text-align:right;font-size:13px}
        .sign span{display:inline-block;border-top:1px solid #0f172a;padding-top:4px;min-width:200px;text-align:center}
      </style></head><body>
      <h1>Niga Homeocentrum · Digital Prescription</h1>
      <div class="meta">
        <div><strong>Patient:</strong> ${escapeHtml(patientName)}<br/><strong>Doctor:</strong> ${escapeHtml(row.doctorName)}${row.qualification ? ` (${escapeHtml(row.qualification)})` : ""}</div>
        <div><strong>eRx:</strong> ${escapeHtml(row.erxNo)}<br/><strong>Date:</strong> ${escapeHtml(formatDate(row.date))}</div>
      </div>
      <div class="notes">
        ${row.symptoms.length ? `<p><strong>Symptoms:</strong> ${row.symptoms.map(escapeHtml).join(", ")}</p>` : ""}
        ${row.diagnosis ? `<p><strong>Diagnosis:</strong> ${escapeHtml(row.diagnosis)}</p>` : ""}
      </div>
      <table><thead><tr><th>#</th><th>Remedy</th><th>Potency</th><th>Dosage</th></tr></thead><tbody>${remedyRows || '<tr><td colspan="4">No remedies</td></tr>'}</tbody></table>
      <div class="notes">${advice}${row.followUp ? `<p><strong>Next follow-up:</strong> ${escapeHtml(formatDate(row.followUp))}</p>` : ""}</div>
      <div class="sign"><span>${escapeHtml(row.doctorName)} · Digitally signed</span></div>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const onDownload = async (row) => {
    if (!row?.signed) return;
    setError("");
    if (!row.erxId) {
      printPrescription(row);
      return;
    }
    setDownloadingId(row.id);
    try {
      const response = await erxPdf(row.erxId);
      const blob = response?.data instanceof Blob ? response.data : response;
      if (!(blob instanceof Blob) || (blob.type && blob.type.includes("json"))) {
        printPrescription(row);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${row.erxNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      const message = s4Message(err);
      if (message) setError(message);
      printPrescription(row);
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page prx-page">
      <Container fluid>
        <div className="prx-page__header">
          <div>
            <h2 className="clinic-page-title">Digital Prescription</h2>
            <p className="clinic-page-subtitle">All prescriptions from your doctors, with dosage details and download.</p>
          </div>
          <div className="prx-page__filters">
            <div className="prx-search">
              <i className="ri-search-line" aria-hidden="true" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctor, symptom or remedy"
              />
            </div>
            <Input
              type="select"
              className="prx-doctor-select"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="">All doctors</option>
              {doctors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Input>
          </div>
        </div>

        {error ? <Alert color="danger">{error}</Alert> : null}

        <div className="prx-stats">
          <div className="prx-stat">
            <span className="prx-stat__icon"><i className="ri-file-list-3-line" aria-hidden="true" /></span>
            <div><strong>{counts.all}</strong><span>Total prescriptions</span></div>
          </div>
          <div className="prx-stat prx-stat--success">
            <span className="prx-stat__icon"><i className="ri-shield-check-line" aria-hidden="true" /></span>
            <div><strong>{counts.signed}</strong><span>Signed</span></div>
          </div>
          <div className="prx-stat prx-stat--warning">
            <span className="prx-stat__icon"><i className="ri-time-line" aria-hidden="true" /></span>
            <div><strong>{counts.unsigned}</strong><span>Awaiting signature</span></div>
          </div>
          <div className="prx-stat prx-stat--info">
            <span className="prx-stat__icon"><i className="ri-stethoscope-line" aria-hidden="true" /></span>
            <div><strong>{doctors.length}</strong><span>Doctors</span></div>
          </div>
        </div>

        {loading ? (
          <div className="prx-empty">
            <Spinner size="sm" />
            <span>Loading prescriptions…</span>
          </div>
        ) : (
          <div className="prx-grid">
            <div className="prx-card">
              <div className="prx-card__head">
                <h5 className="prx-card__title">
                  <i className="ri-file-list-3-line" aria-hidden="true" />
                  Prescription Records
                </h5>
                <div className="prx-tabs">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`prx-tabs__tab${statusTab === tab.id ? " is-active" : ""}`}
                      onClick={() => setStatusTab(tab.id)}
                    >
                      {tab.label}
                      <span>{counts[tab.id]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="prx-card__body">
                {filtered.length === 0 ? (
                  <div className="prx-empty">
                    <i className="ri-file-search-line" aria-hidden="true" />
                    <strong>No prescriptions found</strong>
                    <span>Try another doctor, status or search.</span>
                  </div>
                ) : (
                  <ul className="prx-list">
                    {filtered.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          className={`prx-item${selected?.id === row.id ? " is-active" : ""}`}
                          onClick={() => setSelectedId(row.id)}
                        >
                          <span className="prx-avatar" aria-hidden="true">{getInitials(row.doctorName)}</span>
                          <span className="prx-item__main">
                            <span className="prx-item__top">
                              <span className="prx-item__doctor">{row.doctorName}</span>
                              <StatusChip signed={row.signed} />
                            </span>
                            <span className="prx-item__meta">
                              <i className="ri-calendar-line" aria-hidden="true" />
                              {formatDate(row.date)}
                              <span className="prx-dot" />
                              {row.erxNo}
                            </span>
                            {row.symptoms.length ? (
                              <span className="prx-item__symptoms">
                                {row.symptoms.slice(0, 3).map((symptom) => (
                                  <span key={symptom}>{symptom}</span>
                                ))}
                                {row.symptoms.length > 3 ? <span>+{row.symptoms.length - 3}</span> : null}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="prx-card">
              <div className="prx-card__head">
                <h5 className="prx-card__title">
                  <i className="ri-file-text-line" aria-hidden="true" />
                  Prescription Details
                </h5>
                {selected ? (
                  <div className="d-flex align-items-center gap-2">
                    <StatusChip signed={selected.signed} />
                    <button
                      type="button"
                      className="prx-btn prx-btn--soft"
                      disabled={!selected.signed}
                      title={selected.signed ? "Order these medicines" : "Available after the doctor signs"}
                      onClick={() => setOrderFor(selected)}
                    >
                      <i className="ri-shopping-bag-3-line" aria-hidden="true" />
                      Order Medicines
                    </button>
                    <button
                      type="button"
                      className="prx-btn prx-btn--primary"
                      disabled={!selected.signed || downloadingId === selected.id}
                      title={selected.signed ? "Download prescription" : "Available after the doctor signs"}
                      onClick={() => onDownload(selected)}
                    >
                      {downloadingId === selected.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <i className="ri-download-2-line" aria-hidden="true" />
                      )}
                      Download
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="prx-card__body">
                {!selected ? (
                  <div className="prx-empty">
                    <i className="ri-file-text-line" aria-hidden="true" />
                    <strong>Select a prescription</strong>
                    <span>Its remedies, dosage and advice show here.</span>
                  </div>
                ) : (
                  <div className="prx-detail">
                    <div className="prx-detail__doctor">
                      <span className="prx-avatar prx-avatar--lg" aria-hidden="true">{getInitials(selected.doctorName)}</span>
                      <div className="prx-detail__doctor-info">
                        <strong>{selected.doctorName}</strong>
                        {selected.qualification ? <span>{selected.qualification}</span> : null}
                        {selected.clinic ? (
                          <span>
                            <i className={selected.mode === "Tele Consultation" ? "ri-vidicon-line" : "ri-hospital-line"} aria-hidden="true" />
                            {selected.clinic}
                          </span>
                        ) : null}
                      </div>
                      <dl className="prx-detail__facts">
                        <div><dt>Date</dt><dd>{formatDate(selected.date)}</dd></div>
                        <div><dt>eRx No.</dt><dd>{selected.erxNo}</dd></div>
                        {selected.mode ? <div><dt>Mode</dt><dd>{selected.mode}</dd></div> : null}
                      </dl>
                    </div>

                    <div className="prx-section">
                      <h6 className="prx-section__title">
                        <i className="ri-heart-pulse-line" aria-hidden="true" />
                        Symptoms
                      </h6>
                      {selected.symptoms.length ? (
                        <div className="prx-symptoms">
                          {selected.symptoms.map((symptom) => (
                            <span key={symptom}>{symptom}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="prx-muted">Not recorded.</p>
                      )}
                      {selected.diagnosis ? (
                        <p className="prx-diagnosis">
                          <span>Diagnosis:</span> {selected.diagnosis}
                        </p>
                      ) : null}
                    </div>

                    <div className="prx-section">
                      <h6 className="prx-section__title">
                        <i className="ri-capsule-line" aria-hidden="true" />
                        Remedies & Dosage
                      </h6>
                      {selected.remedies.length ? (
                        <div className="table-responsive">
                          <table className="table prx-table mb-0">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Remedy</th>
                                <th>Potency</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selected.remedies.map((remedy, index) => (
                                <tr key={`${remedy.name}-${index}`}>
                                  <td>{index + 1}</td>
                                  <td className="prx-table__remedy">{remedy.name}</td>
                                  <td>{remedy.potency ? <span className="prx-potency">{remedy.potency}</span> : "—"}</td>
                                  <td>{remedy.frequency || "—"}</td>
                                  <td>{remedy.duration || "—"}</td>
                                  <td>{remedy.instructions || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="prx-muted">Remedy details are not available for this prescription.</p>
                      )}
                    </div>

                    {selected.advice.length || selected.followUp ? (
                      <div className="prx-section prx-section--split">
                        {selected.advice.length ? (
                          <div>
                            <h6 className="prx-section__title">
                              <i className="ri-lightbulb-line" aria-hidden="true" />
                              Advice
                            </h6>
                            <ul className="prx-advice">
                              {selected.advice.map((item) => (
                                <li key={item}>
                                  <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {selected.followUp ? (
                          <div className="prx-followup">
                            <i className="ri-calendar-check-line" aria-hidden="true" />
                            <div>
                              <span>Next follow-up</span>
                              <strong>{formatDate(selected.followUp)}</strong>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {selected.signed ? (
                      <div className="prx-signature">
                        <div>
                          <span className="prx-signature__script">{selected.doctorName.replace(/^Dr\.?\s*/i, "")}</span>
                          <span className="prx-signature__caption">
                            <i className="ri-shield-check-fill" aria-hidden="true" />
                            Digitally signed by {selected.doctorName} on {formatDate(selected.date)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="prx-unsigned-note">
                        <i className="ri-error-warning-line" aria-hidden="true" />
                        <span>
                          Your doctor has not signed this prescription yet. Download is available once it is signed.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <OrderMedicinesModal
          isOpen={Boolean(orderFor)}
          toggle={() => setOrderFor(null)}
          prescription={orderFor}
          onPlaced={onOrderPlaced}
        />
      </Container>
    </div>
  );
};

export default PatientPrescriptionsPage;
