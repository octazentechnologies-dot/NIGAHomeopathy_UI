import React, { useEffect, useMemo, useState } from "react";
import { Input } from "reactstrap";
import Swal from "sweetalert2";
import moment from "moment";

import ModalActionButton from "../../Components/Common/ModalActionButton";
import { appealReview } from "../../helpers/s4Week4Api";
import { listMyDoctorReviews, saveReviewReply } from "../../helpers/s5Week5Api";

const errText = (err, fallback) => (typeof err === "string" ? err : err?.message || fallback);

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Not replied" },
  { id: "replied", label: "Replied" },
];

const normalizeReview = (raw, index) => ({
  id: raw.reviewId ?? raw.ReviewId ?? raw.id ?? raw.Id ?? `review-${index}`,
  patientName: raw.patientName ?? raw.PatientName ?? "Patient",
  rating: Number(raw.rating ?? raw.Rating ?? 0),
  comment: raw.text ?? raw.Text ?? "",
  createdAt: raw.at ?? raw.At ?? null,
  reply: raw.doctorReply ?? raw.DoctorReply ?? "",
  repliedAt: raw.repliedAt ?? raw.RepliedAt ?? null,
  status: String(raw.status ?? raw.Status ?? "").toUpperCase(),
  appealStatus: String(raw.appealStatus ?? raw.AppealStatus ?? "").toUpperCase(),
});

const STATUS_LABEL = { PENDING: "Awaiting moderation", HIDDEN: "Hidden", REJECTED: "Rejected" };

const getInitials = (name) =>
  String(name || "P")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const Stars = ({ value, className = "" }) => (
  <span className={`doctor-reviews__stars ${className}`} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => {
      let icon = "ri-star-line";
      if (value >= n) icon = "ri-star-fill";
      else if (value >= n - 0.5) icon = "ri-star-half-fill";
      return <i key={n} className={icon} aria-hidden="true" />;
    })}
  </span>
);

const DoctorReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [replyingId, setReplyingId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMyDoctorReviews()
      .then((response) => {
        if (cancelled) return;
        const list = Array.isArray(response?.data) ? response.data : [];
        setReviews(list.map(normalizeReview));
        setLoadError("");
      })
      .catch((err) => {
        if (!cancelled) {
          setReviews([]);
          setLoadError(errText(err, "Could not load reviews."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      total: reviews.filter((r) => Math.round(r.rating) === star).length,
    }));
    return { count, average, breakdown };
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter === "pending" && r.reply) return false;
      if (filter === "replied" && !r.reply) return false;
      if (!term) return true;
      return r.patientName.toLowerCase().includes(term) || r.comment.toLowerCase().includes(term);
    });
  }, [reviews, filter, search]);

  const startReply = (review) => {
    setReplyingId(review.id);
    setReplyDraft(review.reply || "");
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyDraft("");
  };

  const saveReply = async (id) => {
    const text = replyDraft.trim();
    if (!text) {
      Swal.fire({ title: "Reply is empty", text: "Write a reply before saving.", icon: "warning", timer: 1500, showConfirmButton: false });
      return;
    }
    setSaving(true);
    try {
      const res = await saveReviewReply(id, text);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: text, repliedAt: res?.repliedAt || new Date().toISOString() } : r)));
      cancelReply();
      Swal.fire({ title: "Reply posted", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Reply not saved", text: errText(err, "Please try again."), icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deleteReply = async (id) => {
    const result = await Swal.fire({
      title: "Delete your reply?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    try {
      await saveReviewReply(id, "");
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: "", repliedAt: null } : r)));
    } catch (err) {
      Swal.fire({ title: "Reply not deleted", text: errText(err, "Please try again."), icon: "error" });
    }
  };

  const requestRemoval = async (review) => {
    const result = await Swal.fire({
      title: "Request review removal",
      text: `Admin will check the review by ${review.patientName} and decide whether to hide it.`,
      input: "textarea",
      inputPlaceholder: "Why should this review be removed?",
      inputAttributes: { maxlength: 500 },
      inputValidator: (value) => (!value || value.trim().length < 3 ? "Please give a reason." : undefined),
      showCancelButton: true,
      confirmButtonText: "Send request",
    });
    if (!result.isConfirmed) return;
    try {
      await appealReview(review.id, { reason: result.value.trim() });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, appealStatus: "OPEN" } : r)));
      Swal.fire({ title: "Request sent", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Request not sent", text: errText(err, "Please try again."), icon: "error" });
    }
  };

  const pendingCount = reviews.filter((r) => !r.reply).length;

  return (
    <div className="doctor-reviews">
      <h5 className="user-profile-page__section-title">
        <i className="ri-star-smile-line" aria-hidden="true" />
        My Reviews
      </h5>

      <div className="doctor-reviews__summary">
        <div className="doctor-reviews__score">
          <i className="ri-star-fill doctor-reviews__score-star" aria-hidden="true" />
          <span className="doctor-reviews__score-value">{summary.average.toFixed(1)}</span>
          <span className="doctor-reviews__score-count">({summary.count} reviews)</span>
        </div>
        <div className="doctor-reviews__breakdown">
          {summary.breakdown.map(({ star, total }) => (
            <div className="doctor-reviews__bar-row" key={star}>
              <span className="doctor-reviews__bar-label">{star}</span>
              <i className="ri-star-fill" aria-hidden="true" />
              <span className="doctor-reviews__bar">
                <span
                  className="doctor-reviews__bar-fill"
                  style={{ width: `${summary.count ? (total / summary.count) * 100 : 0}%` }}
                />
              </span>
              <span className="doctor-reviews__bar-total">{total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="doctor-reviews__toolbar">
        <div className="doctor-reviews__tabs" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`doctor-reviews__tab${filter === f.id ? " is-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === "pending" && pendingCount > 0 ? (
                <span className="doctor-reviews__tab-count">{pendingCount}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="doctor-reviews__search">
          <i className="ri-search-line" aria-hidden="true" />
          <Input
            bsSize="sm"
            type="search"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted small mb-0">Loading reviews…</p>
      ) : loadError ? (
        <p className="text-danger small mb-0">{loadError}</p>
      ) : visibleReviews.length === 0 ? (
        <div className="doctor-reviews__empty">
          <i className="ri-chat-quote-line" aria-hidden="true" />
          No reviews found.
        </div>
      ) : (
        <ul className="doctor-reviews__list">
          {visibleReviews.map((review) => (
            <li className="doctor-reviews__item" key={review.id}>
              <span className="doctor-reviews__avatar" aria-hidden="true">
                {getInitials(review.patientName)}
              </span>
              <div className="doctor-reviews__body">
                <div className="doctor-reviews__head">
                  <div>
                    <span className="doctor-reviews__name">{review.patientName}</span>
                    <span className="doctor-reviews__meta">
                      <Stars value={review.rating} />
                      {review.createdAt ? <span>{moment(review.createdAt).format("DD MMM YYYY")}</span> : null}
                      {STATUS_LABEL[review.status] ? (
                        <span className="badge bg-light text-muted">{STATUS_LABEL[review.status]}</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="doctor-reviews__actions">
                    {!review.reply && replyingId !== review.id ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-soft-primary doctor-reviews__icon-btn"
                        onClick={() => startReply(review)}
                        title="Reply"
                      >
                        <i className="ri-reply-line" aria-hidden="true" />
                      </button>
                    ) : null}
                    {review.appealStatus === "OPEN" ? (
                      <span className="badge bg-warning-subtle text-warning align-self-center">Removal requested</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-soft-danger doctor-reviews__icon-btn"
                        onClick={() => requestRemoval(review)}
                        title="Request removal"
                      >
                        <i className="ri-flag-line" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {review.comment ? <p className="doctor-reviews__comment">{review.comment}</p> : null}

                {replyingId === review.id ? (
                  <div className="doctor-reviews__reply-form">
                    <Input
                      type="textarea"
                      className="doctor-reviews__reply-input"
                      placeholder={`Reply to ${review.patientName}...`}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      maxLength={500}
                      autoFocus
                    />
                    <div className="doctor-reviews__reply-actions">
                      <span className="doctor-reviews__reply-hint">{replyDraft.length}/500</span>
                      <ModalActionButton action="cancel" type="button" onClick={cancelReply}>
                        Cancel
                      </ModalActionButton>
                      <ModalActionButton action="confirm" type="button" disabled={saving} onClick={() => saveReply(review.id)}>
                        {review.reply ? "Update Reply" : "Post Reply"}
                      </ModalActionButton>
                    </div>
                  </div>
                ) : review.reply ? (
                  <div className="doctor-reviews__reply">
                    <div className="doctor-reviews__reply-head">
                      <span className="doctor-reviews__reply-title">
                        <i className="ri-reply-line" aria-hidden="true" />
                        Your reply
                        {review.repliedAt ? (
                          <span className="doctor-reviews__reply-date">{moment(review.repliedAt).format("DD MMM YYYY")}</span>
                        ) : null}
                      </span>
                      <span className="doctor-reviews__reply-tools">
                        <button type="button" onClick={() => startReply(review)} title="Edit reply">
                          <i className="ri-edit-line" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => deleteReply(review.id)} title="Delete reply">
                          <i className="ri-delete-bin-line" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                    <p className="doctor-reviews__reply-text">{review.reply}</p>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DoctorReviewsPanel;
