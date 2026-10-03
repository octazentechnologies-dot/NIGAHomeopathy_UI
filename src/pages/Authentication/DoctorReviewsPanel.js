import React, { useEffect, useMemo, useState } from "react";
import { Input } from "reactstrap";
import Swal from "sweetalert2";
import moment from "moment";

import ModalActionButton from "../../Components/Common/ModalActionButton";
import { myReviews, unwrapS4 } from "../../helpers/s4Week4Api";

const daysAgo = (days) => moment().subtract(days, "days").toISOString();

const SAMPLE_REVIEWS = [
  { id: "r1", patientName: "Amit Sharma", rating: 5, comment: "Good consultation experience.", createdAt: daysAgo(1), reply: "" },
  {
    id: "r2",
    patientName: "Priya Nair",
    rating: 5,
    comment: "Doctor listened patiently and explained the remedy clearly. My skin allergy is much better now.",
    createdAt: daysAgo(3),
    reply: "Thank you Priya, glad you are feeling better. Continue the dose for two more weeks.",
    repliedAt: daysAgo(2),
  },
  { id: "r3", patientName: "Rahul Verma", rating: 4, comment: "Video call was smooth. Waiting time was a little long.", createdAt: daysAgo(6), reply: "" },
  { id: "r4", patientName: "Sneha Patil", rating: 3, comment: "Medicine delivery took more time than expected.", createdAt: daysAgo(12), reply: "" },
  { id: "r5", patientName: "Kiran Joshi", rating: 5, comment: "Very gentle approach for my child. Highly recommended.", createdAt: daysAgo(20), reply: "" },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Not replied" },
  { id: "replied", label: "Replied" },
];

const normalizeReview = (raw, index) => ({
  id: raw.reviewId ?? raw.ReviewId ?? raw.id ?? raw.Id ?? `review-${index}`,
  patientName: raw.patientName ?? raw.PatientName ?? raw.reviewerName ?? raw.ReviewerName ?? "Patient",
  rating: Number(raw.rating ?? raw.Rating ?? 0),
  comment: raw.comment ?? raw.Comment ?? raw.reviewText ?? raw.ReviewText ?? "",
  createdAt: raw.createdAt ?? raw.CreatedAt ?? raw.createdDate ?? raw.CreatedDate ?? null,
  reply: raw.reply ?? raw.Reply ?? raw.doctorReply ?? raw.DoctorReply ?? "",
  repliedAt: raw.repliedAt ?? raw.RepliedAt ?? null,
});

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

  useEffect(() => {
    let cancelled = false;
    myReviews()
      .then((response) => {
        if (cancelled) return;
        const data = unwrapS4(response);
        const list = Array.isArray(data) ? data : data?.items ?? data?.reviews ?? [];
        setReviews(Array.isArray(list) && list.length ? list.map(normalizeReview) : SAMPLE_REVIEWS);
      })
      .catch(() => {
        if (!cancelled) setReviews(SAMPLE_REVIEWS);
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

  const saveReply = (id) => {
    const text = replyDraft.trim();
    if (!text) {
      Swal.fire({ title: "Reply is empty", text: "Write a reply before saving.", icon: "warning", timer: 1500, showConfirmButton: false });
      return;
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: text, repliedAt: new Date().toISOString() } : r)));
    cancelReply();
    Swal.fire({ title: "Reply posted", icon: "success", timer: 1200, showConfirmButton: false });
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
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: "", repliedAt: null } : r)));
  };

  const deleteReview = async (review) => {
    const result = await Swal.fire({
      title: "Delete this review?",
      text: `Review by ${review.patientName} will be removed from your profile.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    setReviews((prev) => prev.filter((r) => r.id !== review.id));
    if (replyingId === review.id) cancelReply();
    Swal.fire({ title: "Review deleted", icon: "success", timer: 1200, showConfirmButton: false });
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
                    <button
                      type="button"
                      className="btn btn-sm btn-soft-danger doctor-reviews__icon-btn"
                      onClick={() => deleteReview(review)}
                      title="Delete review"
                    >
                      <i className="ri-delete-bin-line" aria-hidden="true" />
                    </button>
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
                      <ModalActionButton action="confirm" type="button" onClick={() => saveReply(review.id)}>
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
