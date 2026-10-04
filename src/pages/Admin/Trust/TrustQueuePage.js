import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Container, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import moment from "moment";

import ModalActionButton from "../../../Components/Common/ModalActionButton";
import {
  decideTrust,
  getTrust,
  listTrustQueue,
  listReviewAppeals,
  resolveReviewAppeal,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { downloadDoctorCredentialDocument } from "../../../helpers/realbackend_helper";
import { listPublicDoctors } from "../../../helpers/publicBookingApi";
import {
  REVIEWS_CHANGED_EVENT,
  REVIEW_STATUS,
  listModerationReviews,
  setReviewStatus,
} from "../../../helpers/reviewModerationStore";
import "./trustVerification.css";

const REVIEW_PAGE_SIZE = 4;

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.appeals)) return payload.appeals;
  return [];
};

const doctorName = (row) => {
  const named = `${row.firstName || row.FirstName || ""} ${row.lastName || row.LastName || ""}`.trim();
  const name = row.displayName || row.DisplayName || row.doctorName || named || "Doctor";
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
};

const initialsOf = (name) =>
  String(name || "?")
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const DOCTOR_STATUS = {
  verified: { label: "Verified", tone: "verified" },
  pending: { label: "Pending", tone: "pending" },
  needsinfo: { label: "Needs info", tone: "info" },
  rejected: { label: "Rejected", tone: "rejected" },
};

const doctorStatusKey = (value) => {
  const status = String(value || "pending").toLowerCase().replace(/[\s_-]/g, "");
  if (/verified|approved/.test(status)) return "verified";
  if (/reject/.test(status)) return "rejected";
  if (/needsinfo|info/.test(status)) return "needsinfo";
  return "pending";
};

const DOCTOR_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "needsinfo", label: "Needs info" },
  { id: "rejected", label: "Rejected" },
];

const SAMPLE_DOCTORS = [
  { name: "Dr. Rohit Mehta", qualification: "BHMS, MD", email: "rohit.mehta@homeocentrum.com", status: "verified" },
  { name: "Dr. Sneha Patil", qualification: "BHMS", email: "sneha.patil@homeocentrum.com", status: "pending" },
  { name: "Dr. Amit Shah", qualification: "MD", email: "amit.shah@homeocentrum.com", status: "rejected" },
  { name: "Dr. Kavita Rao", qualification: "BHMS, PGDHHM", email: "kavita.rao@homeocentrum.com", status: "pending" },
  { name: "Dr. Imran Shaikh", qualification: "BHMS", email: "imran.s@homeocentrum.com", status: "needsinfo" },
].map((row, index) => ({ ...row, id: `sample-${index + 1}`, sample: true }));

const REVIEW_TABS = [
  { id: REVIEW_STATUS.PENDING, label: "Pending" },
  { id: REVIEW_STATUS.APPROVED, label: "Approved" },
  { id: REVIEW_STATUS.REJECTED, label: "Rejected" },
];

const REVIEW_REJECT_REASONS = [
  "Spam / promotional content",
  "Abusive or offensive language",
  "Not a genuine consultation",
  "Contains personal information",
];

const Stars = ({ value }) => (
  <span className="tv-stars" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <i key={n} className={value >= n ? "ri-star-fill" : "ri-star-line"} aria-hidden="true" />
    ))}
  </span>
);

/** Note / reason modal shared by doctor decisions and review rejection. */
const DecisionModal = ({ state, onClose, onSubmit, busy }) => {
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (state) {
      setNote("");
      setTouched(false);
    }
  }, [state]);

  if (!state) return null;
  const invalid = state.required && !note.trim();

  return (
    <Modal isOpen centered toggle={onClose} className="patient-list-modal tv-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className={state.icon} style={{ color: state.iconColor || "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">{state.title}</span>
        </span>
      </ModalHeader>
      <ModalBody className="tv-modal__body">
        <p className="tv-modal__subject">{state.subject}</p>
        {state.reasons?.length ? (
          <div className="tv-modal__reasons">
            {state.reasons.map((reason) => (
              <button
                key={reason}
                type="button"
                className={note === reason ? "is-active" : undefined}
                onClick={() => setNote(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
        ) : null}
        <label className="tv-modal__label" htmlFor="tv-decision-note">
          {state.noteLabel}
          {state.required ? <span className="text-danger"> *</span> : null}
        </label>
        <textarea
          id="tv-decision-note"
          rows={3}
          className={`form-control${touched && invalid ? " is-invalid" : ""}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={state.placeholder}
        />
        {touched && invalid ? <div className="invalid-feedback d-block">This note is required.</div> : null}
      </ModalBody>
      <ModalFooter className="tv-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy} />
        <ModalActionButton
          action={state.danger ? "delete" : "confirm"}
          iconClassName={state.confirmIcon}
          loading={busy}
          onClick={() => {
            setTouched(true);
            if (invalid) return;
            onSubmit(note.trim());
          }}
        >
          {state.confirmLabel}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

/** TRU — admin Trust & Verification: doctor credentialing, visitor review moderation, review appeals. */
const TrustQueuePage = () => {
  const [doctors, setDoctors] = useState([]);
  const [doctorsSample, setDoctorsSample] = useState(false);
  const [doctorTab, setDoctorTab] = useState("all");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [docsByDoctor, setDocsByDoctor] = useState({});
  const [appeals, setAppeals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewTab, setReviewTab] = useState(REVIEW_STATUS.PENDING);
  const [reviewDoctor, setReviewDoctor] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [decision, setDecision] = useState(null);

  document.title = "Trust & Verification | Niga Homeocentrum";

  const refreshReviews = useCallback(() => setReviews(listModerationReviews()), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [queueRes, appealRes, publicRes] = await Promise.allSettled([
      listTrustQueue("All"),
      listReviewAppeals(),
      listPublicDoctors({ pageNumber: 1, pageSize: 200 }),
    ]);

    const qualificationById = {};
    if (publicRes.status === "fulfilled") {
      (publicRes.value?.data || []).forEach((row) => {
        const id = row.doctorId ?? row.DoctorId;
        if (id != null) qualificationById[id] = row.qualification || row.Qualification || "";
      });
    }

    let rows = [];
    if (queueRes.status === "fulfilled") {
      rows = asList(unwrapS4(queueRes.value)).map((row) => {
        const id = row.doctorId ?? row.DoctorId;
        return {
          id,
          name: doctorName(row),
          qualification: row.qualification || row.Qualification || qualificationById[id] || "",
          email: row.emailId || row.EmailId || "",
          status: doctorStatusKey(row.verificationStatus || row.VerificationStatus || row.status || row.Status),
        };
      });
    } else {
      setError(s4Message(queueRes.reason));
    }
    setDoctors(rows.length ? rows : SAMPLE_DOCTORS);
    setDoctorsSample(!rows.length);
    setAppeals(appealRes.status === "fulfilled" ? asList(unwrapS4(appealRes.value)) : []);
    refreshReviews();
    setLoading(false);
  }, [refreshReviews]);

  useEffect(() => {
    load();
    window.addEventListener(REVIEWS_CHANGED_EVENT, refreshReviews);
    window.addEventListener("storage", refreshReviews);
    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, refreshReviews);
      window.removeEventListener("storage", refreshReviews);
    };
  }, [load, refreshReviews]);

  useEffect(() => {
    setReviewPage(1);
  }, [reviewTab, reviewDoctor]);

  /* ---------- Doctor credentialing ---------- */

  const doctorCounts = useMemo(() => {
    const counts = { all: doctors.length, pending: 0, verified: 0, needsinfo: 0, rejected: 0 };
    doctors.forEach((row) => {
      counts[row.status] += 1;
    });
    return counts;
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    return doctors.filter((row) => {
      if (doctorTab !== "all" && row.status !== doctorTab) return false;
      if (!query) return true;
      return [row.name, row.qualification, row.email].join(" ").toLowerCase().includes(query);
    });
  }, [doctors, doctorSearch, doctorTab]);

  const applyDoctorDecision = async (doctor, verdict, note = "") => {
    setBusyId(`doc-${doctor.id}`);
    setError("");
    const nextStatus = { Approve: "verified", Reject: "rejected", NeedsInfo: "needsinfo" }[verdict];
    try {
      if (!doctor.sample) await decideTrust(doctor.id, { decision: verdict, note });
      setDoctors((prev) => prev.map((row) => (row.id === doctor.id ? { ...row, status: nextStatus } : row)));
      setNotice(`${doctor.name} marked as ${DOCTOR_STATUS[nextStatus].label.toLowerCase()}.`);
      setDecision(null);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const toggleDocuments = async (doctor) => {
    if (docsByDoctor[doctor.id]) {
      setDocsByDoctor((prev) => {
        const next = { ...prev };
        delete next[doctor.id];
        return next;
      });
      return;
    }
    if (doctor.sample) {
      setDocsByDoctor((prev) => ({ ...prev, [doctor.id]: [] }));
      return;
    }
    setBusyId(`files-${doctor.id}`);
    setError("");
    try {
      const detail = unwrapS4(await getTrust(doctor.id));
      const docs = detail?.documents || detail?.Documents || [];
      setDocsByDoctor((prev) => ({ ...prev, [doctor.id]: Array.isArray(docs) ? docs : [] }));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const openDocument = async (docId) => {
    try {
      const response = await downloadDoctorCredentialDocument(docId);
      const blob = response?.data instanceof Blob ? response.data : response;
      if (!(blob instanceof Blob)) throw new Error("Could not open the document.");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(s4Message(err) || err?.message || "Could not open the document.");
    }
  };

  /* ---------- Review queue ---------- */

  const reviewCounts = useMemo(() => {
    const scoped = reviewDoctor === "all" ? reviews : reviews.filter((row) => row.doctorName === reviewDoctor);
    return REVIEW_TABS.reduce((acc, tab) => {
      acc[tab.id] = scoped.filter((row) => row.status === tab.id).length;
      return acc;
    }, {});
  }, [reviews, reviewDoctor]);

  const reviewDoctors = useMemo(
    () => [...new Set(reviews.map((row) => row.doctorName).filter(Boolean))].sort(),
    [reviews]
  );

  const filteredReviews = useMemo(
    () =>
      reviews.filter(
        (row) => row.status === reviewTab && (reviewDoctor === "all" || row.doctorName === reviewDoctor)
      ),
    [reviews, reviewTab, reviewDoctor]
  );

  const reviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEW_PAGE_SIZE));
  const reviewStart = (reviewPage - 1) * REVIEW_PAGE_SIZE;
  const pageReviews = filteredReviews.slice(reviewStart, reviewStart + REVIEW_PAGE_SIZE);

  const approveReview = (review) => {
    setReviewStatus(review.id, REVIEW_STATUS.APPROVED);
    setNotice(`Review by ${review.name} approved and published on ${review.doctorName || "the doctor"}'s profile.`);
  };

  const rejectReview = (review, note) => {
    setReviewStatus(review.id, REVIEW_STATUS.REJECTED, note);
    setNotice(`Review by ${review.name} rejected.`);
    setDecision(null);
  };

  /* ---------- Decision modal ---------- */

  const openDoctorDecision = (doctor, verdict) => {
    const reject = verdict === "Reject";
    setDecision({
      kind: "doctor",
      target: doctor,
      verdict,
      title: reject ? "Reject credentials" : "Request more information",
      icon: reject ? "ri-close-circle-line" : "ri-question-line",
      iconColor: reject ? "#dc3545" : "#25a0e2",
      subject: `${doctor.name}${doctor.qualification ? ` · ${doctor.qualification}` : ""}`,
      noteLabel: reject ? "Reason for rejection" : "What information is needed?",
      placeholder: reject ? "e.g. Registration certificate is not valid" : "e.g. Please upload a clear copy of your BHMS degree",
      required: true,
      danger: reject,
      confirmLabel: reject ? "Reject" : "Send request",
      confirmIcon: reject ? "ri-close-circle-line" : "ri-send-plane-line",
    });
  };

  const openReviewReject = (review) => {
    setDecision({
      kind: "review",
      target: review,
      title: review.status === REVIEW_STATUS.APPROVED ? "Unpublish review" : "Reject review",
      icon: "ri-chat-delete-line",
      iconColor: "#dc3545",
      subject: `${review.name} → ${review.doctorName || "Doctor"}`,
      reasons: REVIEW_REJECT_REASONS,
      noteLabel: "Reason (internal)",
      placeholder: "Pick a reason above or type your own",
      required: false,
      danger: true,
      confirmLabel: review.status === REVIEW_STATUS.APPROVED ? "Unpublish" : "Reject",
      confirmIcon: "ri-close-circle-line",
    });
  };

  const submitDecision = (note) => {
    if (!decision) return;
    if (decision.kind === "doctor") applyDoctorDecision(decision.target, decision.verdict, note);
    else rejectReview(decision.target, note);
  };

  const stats = [
    { label: "Verified doctors", value: doctorCounts.verified, icon: "ri-shield-check-line", tone: "green" },
    { label: "Awaiting verification", value: doctorCounts.pending + doctorCounts.needsinfo, icon: "ri-time-line", tone: "amber" },
    { label: "Reviews to moderate", value: reviews.filter((r) => r.status === REVIEW_STATUS.PENDING).length, icon: "ri-chat-check-line", tone: "blue" },
    { label: "Published reviews", value: reviews.filter((r) => r.status === REVIEW_STATUS.APPROVED).length, icon: "ri-star-smile-line", tone: "violet" },
  ];

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="tv-page">
          <div className="tv-page__head">
            <div>
              <h2 className="clinic-page-title mb-1">Trust &amp; Verification</h2>
              <p className="clinic-page-subtitle mb-0">
                Verify doctor credentials and moderate visitor reviews before they appear on the website.
              </p>
            </div>
            <button type="button" className="tv-btn tv-btn--soft" onClick={load} disabled={loading}>
              <i className={loading ? "ri-loader-4-line tv-spin" : "ri-refresh-line"} aria-hidden="true" />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="tv-alert tv-alert--error">
              <i className="ri-error-warning-line" aria-hidden="true" />
              <span>{error}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setError("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className="tv-alert tv-alert--success">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <span>{notice}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <div className="tv-stats">
            {stats.map((stat) => (
              <div className="tv-stat" key={stat.label}>
                <span className={`tv-stat__icon tv-stat__icon--${stat.tone}`}>
                  <i className={stat.icon} aria-hidden="true" />
                </span>
                <div>
                  <strong>{loading ? "—" : stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="tv-grid">
            {/* Doctor credentialing */}
            <section className="tv-card">
              <header className="tv-card__head">
                <span className="tv-card__title">
                  <i className="ri-shield-user-line" aria-hidden="true" />
                  Doctor Credentialing
                  {doctorsSample ? <span className="tv-sample">Sample data</span> : null}
                </span>
                <span className="tv-card__meta">{doctors.length} doctors</span>
              </header>
              <div className="tv-card__body">
                <div className="tv-toolbar">
                  <div className="tv-search">
                    <i className="ri-search-line" aria-hidden="true" />
                    <input
                      type="text"
                      className="form-control"
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Search doctor or qualification"
                    />
                  </div>
                </div>
                <div className="tv-tabs">
                  {DOCTOR_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tv-tabs__tab${doctorTab === tab.id ? " is-active" : ""}`}
                      onClick={() => setDoctorTab(tab.id)}
                    >
                      {tab.label}
                      <span>{doctorCounts[tab.id]}</span>
                    </button>
                  ))}
                </div>

                <table className="table tv-table mb-0">
                  <colgroup>
                    <col />
                    <col className="tv-col-qual" />
                    <col className="tv-col-status" />
                    <col className="tv-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Qualification</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="tv-empty">
                          <Spinner size="sm" />
                        </td>
                      </tr>
                    ) : filteredDoctors.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="tv-empty">
                          No doctors in this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDoctors.map((doctor) => {
                        const status = DOCTOR_STATUS[doctor.status];
                        const docs = docsByDoctor[doctor.id];
                        const busy = busyId === `doc-${doctor.id}`;
                        return (
                          <Fragment key={doctor.id}>
                            <tr>
                              <td>
                                <div className="tv-person">
                                  <span className="tv-avatar">{initialsOf(doctor.name)}</span>
                                  <span className="tv-person__name" title={doctor.name}>
                                    {doctor.name}
                                  </span>
                                </div>
                              </td>
                              <td className="tv-qual" title={doctor.qualification}>
                                {doctor.qualification || "—"}
                              </td>
                              <td>
                                <span className={`tv-chip tv-chip--${status.tone}`}>{status.label}</span>
                              </td>
                              <td>
                                <div className="tv-actions">
                                  <button
                                    type="button"
                                    className={`tv-icon-btn${docs ? " is-active" : ""}`}
                                    title="Credential documents"
                                    disabled={busyId === `files-${doctor.id}`}
                                    onClick={() => toggleDocuments(doctor)}
                                  >
                                    <i className="ri-file-list-3-line" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="tv-icon-btn tv-icon-btn--approve"
                                    title="Approve"
                                    disabled={busy || doctor.status === "verified"}
                                    onClick={() => applyDoctorDecision(doctor, "Approve")}
                                  >
                                    <i className="ri-check-line" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="tv-icon-btn tv-icon-btn--info"
                                    title="Needs more info"
                                    disabled={busy}
                                    onClick={() => openDoctorDecision(doctor, "NeedsInfo")}
                                  >
                                    <i className="ri-question-line" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="tv-icon-btn tv-icon-btn--reject"
                                    title="Reject"
                                    disabled={busy || doctor.status === "rejected"}
                                    onClick={() => openDoctorDecision(doctor, "Reject")}
                                  >
                                    <i className="ri-close-line" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {docs ? (
                              <tr className="tv-docs-row">
                                <td colSpan={4}>
                                  {docs.length === 0 ? (
                                    <span className="tv-docs-empty">No credential files uploaded for this doctor.</span>
                                  ) : (
                                    <ul className="tv-docs">
                                      {docs.map((doc) => {
                                        const docId = doc.doctorCredentialDocumentId || doc.DoctorCredentialDocumentId;
                                        return (
                                          <li key={docId}>
                                            <i className="ri-file-text-line" aria-hidden="true" />
                                            <span>
                                              {doc.documentType || doc.DocumentType} — {doc.fileName || doc.FileName || "document"}
                                            </span>
                                            <button type="button" onClick={() => openDocument(docId)}>
                                              View
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Review queue */}
            <section className="tv-card">
              <header className="tv-card__head">
                <span className="tv-card__title">
                  <i className="ri-chat-check-line" aria-hidden="true" />
                  Review Queue
                </span>
                <select
                  className="tv-select"
                  value={reviewDoctor}
                  onChange={(e) => setReviewDoctor(e.target.value)}
                  aria-label="Filter by doctor"
                >
                  <option value="all">All doctors</option>
                  {reviewDoctors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </header>
              <div className="tv-card__body">
                <div className="tv-segment">
                  {REVIEW_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={reviewTab === tab.id ? "is-active" : undefined}
                      onClick={() => setReviewTab(tab.id)}
                    >
                      {tab.label} ({reviewCounts[tab.id] || 0})
                    </button>
                  ))}
                </div>

                {pageReviews.length === 0 ? (
                  <div className="tv-review-empty">
                    <i className="ri-chat-smile-2-line" aria-hidden="true" />
                    <span>No {reviewTab.toLowerCase()} reviews.</span>
                  </div>
                ) : (
                  <ul className="tv-reviews">
                    {pageReviews.map((review) => (
                      <li key={review.id} className="tv-review">
                        <span className="tv-review__avatar">{initialsOf(review.name)}</span>
                        <div className="tv-review__body">
                          <div className="tv-review__head">
                            <strong>{review.name}</strong>
                            <span className="tv-review__date">{moment(review.at).fromNow()}</span>
                          </div>
                          <div className="tv-review__meta">
                            <Stars value={review.rating} />
                            <span className="tv-review__doctor">
                              <i className="ri-stethoscope-line" aria-hidden="true" />
                              {review.doctorName || "Doctor"}
                            </span>
                            {review.mode ? <span className="tv-review__mode">{review.mode}</span> : null}
                          </div>
                          <p className="tv-review__text">{review.text}</p>
                          {review.status === REVIEW_STATUS.REJECTED && review.note ? (
                            <p className="tv-review__note">
                              <i className="ri-information-line" aria-hidden="true" />
                              {review.note}
                            </p>
                          ) : null}
                          <div className="tv-review__actions">
                            {review.status !== REVIEW_STATUS.APPROVED ? (
                              <button type="button" className="tv-btn tv-btn--approve" onClick={() => approveReview(review)}>
                                <i className="ri-check-line" aria-hidden="true" />
                                {review.status === REVIEW_STATUS.REJECTED ? "Restore & approve" : "Approve"}
                              </button>
                            ) : (
                              <span className="tv-review__live">
                                <i className="ri-global-line" aria-hidden="true" />
                                Live on profile
                              </span>
                            )}
                            {review.status !== REVIEW_STATUS.REJECTED ? (
                              <button type="button" className="tv-btn tv-btn--reject" onClick={() => openReviewReject(review)}>
                                <i className="ri-close-line" aria-hidden="true" />
                                {review.status === REVIEW_STATUS.APPROVED ? "Unpublish" : "Reject"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {filteredReviews.length > REVIEW_PAGE_SIZE ? (
                  <div className="tv-footer">
                    <span>
                      Showing {reviewStart + 1}–{Math.min(reviewStart + REVIEW_PAGE_SIZE, filteredReviews.length)} of{" "}
                      {filteredReviews.length}
                    </span>
                    <div className="tv-pager">
                      <button
                        type="button"
                        disabled={reviewPage <= 1}
                        onClick={() => setReviewPage((p) => p - 1)}
                        aria-label="Previous page"
                      >
                        <i className="ri-arrow-left-s-line" aria-hidden="true" />
                      </button>
                      <span>
                        {reviewPage} / {reviewPages}
                      </span>
                      <button
                        type="button"
                        disabled={reviewPage >= reviewPages}
                        onClick={() => setReviewPage((p) => p + 1)}
                        aria-label="Next page"
                      >
                        <i className="ri-arrow-right-s-line" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          {/* Review appeals */}
          <section className="tv-card">
            <header className="tv-card__head">
              <span className="tv-card__title">
                <i className="ri-scales-3-line" aria-hidden="true" />
                Review Appeals
              </span>
              <span className="tv-card__meta">Raised by doctors against a published review</span>
            </header>
            <div className="tv-card__body">
              {appeals.length === 0 ? (
                <div className="tv-review-empty">
                  <i className="ri-inbox-line" aria-hidden="true" />
                  <span>No open appeals.</span>
                </div>
              ) : (
                <ul className="tv-appeals">
                  {appeals.map((row) => {
                    const id = row.reviewAppealId || row.ReviewAppealId || row.appealId || row.AppealId || row.id;
                    return (
                      <li key={id}>
                        <div>
                          <strong>
                            Appeal #{id} · Doctor {row.doctorId || row.DoctorId || "—"}
                          </strong>
                          <span>{row.reason || row.Reason || row.note || "—"}</span>
                        </div>
                        <button
                          type="button"
                          className="tv-btn tv-btn--soft"
                          disabled={busyId === `appeal-${id}`}
                          onClick={async () => {
                            setBusyId(`appeal-${id}`);
                            try {
                              await resolveReviewAppeal(id, { decision: "Uphold", note: "Kept from Trust & Verification" });
                              setNotice(`Appeal #${id} resolved.`);
                              await load();
                            } catch (err) {
                              setError(s4Message(err));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          <i className="ri-check-double-line" aria-hidden="true" />
                          Resolve
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </Container>

      <DecisionModal
        state={decision}
        busy={decision?.kind === "doctor" && busyId === `doc-${decision.target.id}`}
        onClose={() => setDecision(null)}
        onSubmit={submitDecision}
      />
    </div>
  );
};

export default TrustQueuePage;
