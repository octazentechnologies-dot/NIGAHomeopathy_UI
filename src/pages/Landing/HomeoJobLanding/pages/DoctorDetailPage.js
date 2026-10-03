import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { DOCTORS } from "../constants/doctorsData";
import {
    getPublicDoctor,
    getPublicDoctorRanking,
    getPublicDoctorSlots,
    listPublicArticles,
    listPublicDoctorReviews,
    mapPublicDoctorCard,
    toIsoDate,
} from "../../../../helpers/publicBookingApi";
import {
    REVIEWS_CHANGED_EVENT,
    listApprovedReviewsForDoctor,
    submitVisitorReview,
} from "../../../../helpers/reviewModerationStore";
import WaitlistJoinPanel from "../components/WaitlistJoinPanel";

const TABS = [
    { id: "overview", label: "Overview", icon: "ri-file-text-line" },
    { id: "clinic", label: "Clinic Details", icon: "ri-map-pin-line" },
    { id: "reviews", label: "Reviews", icon: "ri-star-line" },
    { id: "articles", label: "Articles", icon: "ri-article-line" },
];

const SAMPLE_REVIEWS = [
    {
        name: "Amit Sharma",
        rating: 5,
        daysAgo: 4,
        mode: "In-Clinic",
        text: "Very patient listener. Explained the remedy and diet clearly. My chronic acidity is much better within a month.",
    },
    {
        name: "Priya Nair",
        rating: 5,
        daysAgo: 11,
        mode: "Tele Consultation",
        text: "Video consultation was smooth and on time. Got my e-prescription right after the call.",
    },
    {
        name: "Rahul Verma",
        rating: 4,
        daysAgo: 19,
        mode: "In-Clinic",
        text: "Good experience overall. Clinic is clean and staff is helpful. Waiting time was a little long.",
    },
    {
        name: "Sneha Patil",
        rating: 5,
        daysAgo: 33,
        mode: "In-Clinic",
        text: "Gentle treatment for my child's recurring cold. Highly recommended for kids.",
    },
    {
        name: "Kiran Joshi",
        rating: 4,
        daysAgo: 48,
        mode: "Tele Consultation",
        text: "Helpful follow-up and clear instructions. Skin allergy has reduced noticeably.",
    },
];

const getInitials = (name) =>
    String(name || "P")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

const formatReviewDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const buildSampleReviews = () =>
    SAMPLE_REVIEWS.map((review, index) => {
        const date = new Date();
        date.setDate(date.getDate() - review.daysAgo);
        return {
            id: `sample-${index}`,
            name: review.name,
            initials: getInitials(review.name),
            rating: review.rating,
            mode: review.mode,
            text: review.text,
            date: formatReviewDate(date),
        };
    });

const normalizeReview = (row, index) => {
    const name = row.patientName || row.PatientName || row.reviewerName || row.ReviewerName || row.name || "Patient";
    return {
        id: row.reviewId || row.ReviewId || row.id || `review-${index}`,
        name,
        initials: getInitials(name),
        rating: Number(row.rating ?? row.Rating ?? 0),
        mode: row.consultMode || row.ConsultMode || row.mode || "",
        text: row.text || row.Text || row.comment || row.Comment || "—",
        date: formatReviewDate(row.at || row.At || row.createdAt || row.CreatedAt),
    };
};

const REVIEW_MODES = ["In-Clinic", "Tele Consultation"];
const REVIEW_MIN_LENGTH = 10;
const REVIEW_MAX_LENGTH = 500;
const EMPTY_REVIEW_FORM = { name: "", rating: 0, mode: REVIEW_MODES[0], text: "" };

const summarizeReviews = (list) => {
    const count = list.length;
    const average = count ? list.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        total: list.filter((r) => Math.round(r.rating) === star).length,
    }));
    return { count, average, breakdown };
};

const Stars = ({ value }) => (
    <span className="homeojob-doctor-detail__stars" aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => {
            let icon = "ri-star-line";
            if (value >= n) icon = "ri-star-fill";
            else if (value >= n - 0.5) icon = "ri-star-half-fill";
            return <i key={n} className={icon} aria-hidden="true" />;
        })}
    </span>
);

const formatBookingDate = (date) => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} (${weekdays[date.getDay()]})`;
};

const DoctorDetailPage = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const mockDoctor = DOCTORS.find((doc) => String(doc.id) === String(doctorId)) || null;
    const [doctor, setDoctor] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [favorite, setFavorite] = useState(false);
    const [consultMode, setConsultMode] = useState("clinic");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [bookingDate, setBookingDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [loadError, setLoadError] = useState("");
    const [articles, setArticles] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [approvedLocalReviews, setApprovedLocalReviews] = useState([]);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewError, setReviewError] = useState("");
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [rankingReasons, setRankingReasons] = useState([]);

    useEffect(() => {
        const refresh = () => setApprovedLocalReviews(listApprovedReviewsForDoctor(doctorId));
        refresh();
        window.addEventListener(REVIEWS_CHANGED_EVENT, refresh);
        window.addEventListener("storage", refresh);
        return () => {
            window.removeEventListener(REVIEWS_CHANGED_EVENT, refresh);
            window.removeEventListener("storage", refresh);
        };
    }, [doctorId]);

    useEffect(() => {
        window.scrollTo(0, 0);
        let cancelled = false;
        setLoadError("");
        getPublicDoctor(doctorId)
            .then(async (row) => {
                if (cancelled) return;
                const mapped = mapPublicDoctorCard(row, mockDoctor || {});
                try {
                    const ranking = await getPublicDoctorRanking(doctorId);
                    mapped.rankingSummary = ranking.summary || ranking.rankingSummary || mapped.rankingSummary;
                    const reasons = ranking.reasons || ranking.rankingReasons || [];
                    mapped.rankingReasons = reasons;
                    if (!cancelled) setRankingReasons(Array.isArray(reasons) ? reasons : []);
                } catch {
                    // profile already has rankingSummary
                }
                setDoctor(mapped);
                try {
                    const reviewRows = await listPublicDoctorReviews(doctorId);
                    if (!cancelled) setReviews(Array.isArray(reviewRows) ? reviewRows : []);
                } catch {
                    if (!cancelled) setReviews([]);
                }
            })
            .catch(() => {
                if (cancelled) return;
                if (mockDoctor) setDoctor(mockDoctor);
                else setLoadError("Doctor not found or not verified for directory.");
            });
        listPublicArticles({ pageNumber: 1, pageSize: 6 })
            .then((list) => {
                if (!cancelled) setArticles(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setArticles([]);
            });
        return () => {
            cancelled = true;
        };
    }, [doctorId]);

    useEffect(() => {
        if (doctor?.name) document.title = `${doctor.name} | ${SITE.name}`;
    }, [doctor?.name]);

    useEffect(() => {
        if (!doctor?.id) return undefined;
        let cancelled = false;
        getPublicDoctorSlots(doctor.id, bookingDate)
            .then((payload) => {
                if (cancelled) return;
                const list = (payload.slots || payload.Slots || []).filter((slot) => {
                    const status = String(slot.status || slot.Status || "available").toLowerCase();
                    return status === "available";
                });
                setSlots(list);
                setSelectedSlot((prev) => {
                    if (prev && list.some((slot) => (slot.time || slot.label) === prev)) return prev;
                    return list[0]?.time || list[0]?.label || "";
                });
            })
            .catch(() => {
                if (cancelled) return;
                setSlots([]);
                setSelectedSlot("");
            });
        return () => {
            cancelled = true;
        };
    }, [doctor?.id, bookingDate]);

    const handleReviewSubmit = (event) => {
        event.preventDefault();
        const text = reviewForm.text.trim();
        if (!reviewForm.name.trim()) {
            setReviewError("Please enter your name.");
            return;
        }
        if (!reviewForm.rating) {
            setReviewError("Please select a star rating.");
            return;
        }
        if (text.length < REVIEW_MIN_LENGTH) {
            setReviewError(`Please write at least ${REVIEW_MIN_LENGTH} characters about your experience.`);
            return;
        }
        submitVisitorReview({
            doctorId,
            doctorName: doctor?.name,
            name: reviewForm.name,
            rating: reviewForm.rating,
            mode: reviewForm.mode,
            text,
        });
        setReviewError("");
        setReviewForm(EMPTY_REVIEW_FORM);
        setReviewFormOpen(false);
        setReviewSubmitted(true);
    };

    const handleBook = () => {
        if (!selectedSlot || !doctor?.id) return;
        const params = new URLSearchParams({
            date: toIsoDate(bookingDate),
            slot: selectedSlot,
            mode: consultMode,
        });
        navigate(`${landingPath(`book/${doctor.id}/confirm`)}?${params.toString()}`);
    };

    if (loadError && !doctor) {
        return (
            <section className="homeojob-doctor-detail">
                <Container>
                    <p className="text-danger py-5">{loadError}</p>
                    <Link to={landingPath("find-doctor")}>Back to Find a Doctor</Link>
                </Container>
            </section>
        );
    }

    if (!doctor) {
        return (
            <section className="homeojob-doctor-detail">
                <Container>
                    <p className="text-muted py-5">Loading doctor profile…</p>
                </Container>
            </section>
        );
    }

    const phone = doctor.phone || "+91 98765 43210";
    const dateValue = toIsoDate(bookingDate);
    const verifiedReviews = [...approvedLocalReviews, ...reviews].map(normalizeReview);
    const displayReviews = verifiedReviews.length ? verifiedReviews : buildSampleReviews();
    const reviewSummary = summarizeReviews(displayReviews);

    return (
        <section className="homeojob-doctor-detail">
            <Container fluid className="homeojob-doctor-detail__container">
                <nav className="homeojob-doctor-detail__breadcrumb" aria-label="Breadcrumb">
                    <Link to={landingPath()}>Home</Link>
                    <span aria-hidden="true">&gt;</span>
                    <Link to={landingPath("find-doctor")}>Find a Doctor</Link>
                    <span aria-hidden="true">&gt;</span>
                    <span>{doctor.name}</span>
                </nav>

                <Row className="g-3 g-xl-4 homeojob-doctor-detail__layout">
                    <Col lg={8} className="homeojob-doctor-detail__main">
                        <article className="homeojob-doctor-detail__card homeojob-doctor-detail__profile">
                            <div className="homeojob-doctor-detail__actions">
                                <button
                                    type="button"
                                    className={favorite ? "is-active" : undefined}
                                    aria-label="Save"
                                    onClick={() => setFavorite((v) => !v)}
                                >
                                    <i className={favorite ? "ri-heart-fill" : "ri-heart-line"} />
                                </button>
                                <button type="button" aria-label="Share">
                                    <i className="ri-share-forward-line" />
                                </button>
                                <button type="button" aria-label="Report">
                                    <i className="ri-flag-line" />
                                </button>
                            </div>

                            <div className="homeojob-doctor-detail__hero">
                                <div className="homeojob-doctor-detail__avatar-wrap">
                                    <img
                                        src={doctor.image}
                                        alt={doctor.name}
                                        className="homeojob-doctor-detail__avatar"
                                    />
                                    <span className="homeojob-doctor-detail__verified" title="Verified">
                                        <i className="ri-check-line" />
                                    </span>
                                </div>

                                <div className="homeojob-doctor-detail__intro">
                                    <h1 className="homeojob-doctor-detail__name">
                                        {doctor.name}
                                        <i
                                            className="ri-checkbox-circle-fill"
                                            title="Verified"
                                            aria-hidden="true"
                                        />
                                    </h1>
                                    <p className="homeojob-doctor-detail__degree">{doctor.degree}</p>
                                    <p className="homeojob-doctor-detail__specs">{doctor.specialties}</p>
                                    <p className="homeojob-doctor-detail__exp">{doctor.experience}</p>
                                    <p className="homeojob-doctor-detail__rating">
                                        <i className="ri-star-fill" aria-hidden="true" />
                                        <strong>{doctor.rating.toFixed(1)}</strong>
                                        <span>({doctor.reviews} reviews)</span>
                                    </p>
                                    <p className="homeojob-doctor-detail__clinic">
                                        <i className="ri-map-pin-fill" aria-hidden="true" />
                                        {doctor.clinicName}, {doctor.location}
                                    </p>
                                </div>
                            </div>

                            <div className="homeojob-doctor-detail__fees">
                                <div className="homeojob-doctor-detail__fee-card homeojob-doctor-detail__fee-card--clinic">
                                    <span className="homeojob-doctor-detail__fee-icon">
                                        <i className="ri-user-3-fill" />
                                    </span>
                                    <div>
                                        <strong>₹ {doctor.inClinic}</strong>
                                        <span>In-Clinic Consultation</span>
                                    </div>
                                </div>
                                <div className="homeojob-doctor-detail__fee-card homeojob-doctor-detail__fee-card--tele">
                                    <span className="homeojob-doctor-detail__fee-icon">
                                        <i className="ri-vidicon-fill" />
                                    </span>
                                    <div>
                                        <strong>₹ {doctor.tele}</strong>
                                        <span>Tele Consultation</span>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article className="homeojob-doctor-detail__card homeojob-doctor-detail__info">
                            <div className="homeojob-doctor-detail__tabs" role="tablist">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                        className={activeTab === tab.id ? "is-active" : undefined}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <i className={tab.icon} aria-hidden="true" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "overview" && (
                                <div className="homeojob-doctor-detail__content">
                                    <h2 className="homeojob-doctor-detail__section-title">
                                        About {doctor.name}
                                    </h2>
                                    <p className="homeojob-doctor-detail__about">{doctor.about}</p>

                                    <div className="homeojob-doctor-detail__checklist">
                                        <span>
                                            <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                            {doctor.education}
                                        </span>
                                        <span>
                                            <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                            {doctor.specialtyLine}
                                        </span>
                                        <span>
                                            <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                            {doctor.languages}
                                        </span>
                                    </div>

                                    <h2 className="homeojob-doctor-detail__section-title">
                                        Areas of Expertise
                                    </h2>
                                    <div className="homeojob-doctor-detail__tags">
                                        {doctor.expertise.map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "clinic" && (
                                <div className="homeojob-doctor-detail__content">
                                    <h2 className="homeojob-doctor-detail__section-title">
                                        Clinic Details
                                    </h2>
                                    <p className="homeojob-doctor-detail__about">
                                        <strong>{doctor.clinicName}</strong>
                                        <br />
                                        {doctor.clinicAddress}
                                    </p>
                                    <p className="homeojob-doctor-detail__about mb-0">
                                        <strong>Hours:</strong> Mon - Sat, {doctor.timings.weekdays}
                                        <br />
                                        <strong>Sunday:</strong> {doctor.timings.sunday}
                                    </p>
                                </div>
                            )}

                            {activeTab === "reviews" && (
                                <div className="homeojob-doctor-detail__content">
                                    <div className="homeojob-doctor-detail__reviews-head">
                                        <h2 className="homeojob-doctor-detail__section-title mb-0">
                                            Patient Reviews
                                        </h2>
                                        {!reviewFormOpen ? (
                                            <button
                                                type="button"
                                                className="homeojob-doctor-detail__write-review"
                                                onClick={() => {
                                                    setReviewFormOpen(true);
                                                    setReviewSubmitted(false);
                                                    setReviewError("");
                                                }}
                                            >
                                                <i className="ri-edit-2-line" aria-hidden="true" />
                                                Write a review
                                            </button>
                                        ) : null}
                                    </div>

                                    {reviewSubmitted ? (
                                        <div className="homeojob-doctor-detail__review-notice" role="status">
                                            <i className="ri-time-line" aria-hidden="true" />
                                            <div>
                                                <strong>Thank you! Your review has been submitted.</strong>
                                                <span>
                                                    Our team verifies every review before publishing. It will appear here
                                                    once approved.
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Dismiss"
                                                onClick={() => setReviewSubmitted(false)}
                                            >
                                                <i className="ri-close-line" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : null}

                                    {reviewFormOpen ? (
                                        <form className="homeojob-doctor-detail__review-form" onSubmit={handleReviewSubmit} noValidate>
                                            <h3>Share your experience with {doctor.name}</h3>
                                            <div className="homeojob-doctor-detail__review-form-row">
                                                <label>
                                                    <span>Your name</span>
                                                    <input
                                                        type="text"
                                                        maxLength={60}
                                                        value={reviewForm.name}
                                                        onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                                                        placeholder="e.g. Amit Sharma"
                                                    />
                                                </label>
                                                <label>
                                                    <span>Consultation type</span>
                                                    <select
                                                        value={reviewForm.mode}
                                                        onChange={(e) => setReviewForm((f) => ({ ...f, mode: e.target.value }))}
                                                    >
                                                        {REVIEW_MODES.map((mode) => (
                                                            <option key={mode} value={mode}>
                                                                {mode}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="homeojob-doctor-detail__review-form-rating">
                                                <span>Your rating</span>
                                                <div
                                                    className="homeojob-doctor-detail__star-picker"
                                                    onMouseLeave={() => setReviewHover(0)}
                                                >
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            aria-label={`${n} star${n > 1 ? "s" : ""}`}
                                                            className={(reviewHover || reviewForm.rating) >= n ? "is-on" : undefined}
                                                            onMouseEnter={() => setReviewHover(n)}
                                                            onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                                                        >
                                                            <i
                                                                className={(reviewHover || reviewForm.rating) >= n ? "ri-star-fill" : "ri-star-line"}
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <label className="homeojob-doctor-detail__review-form-text">
                                                <span>Your review</span>
                                                <textarea
                                                    rows={3}
                                                    maxLength={REVIEW_MAX_LENGTH}
                                                    value={reviewForm.text}
                                                    onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                                                    placeholder="How was the consultation, treatment and clinic experience?"
                                                />
                                                <small>
                                                    {reviewForm.text.length}/{REVIEW_MAX_LENGTH}
                                                </small>
                                            </label>
                                            {reviewError ? (
                                                <p className="homeojob-doctor-detail__review-error">{reviewError}</p>
                                            ) : null}
                                            <div className="homeojob-doctor-detail__review-form-actions">
                                                <span>
                                                    <i className="ri-shield-check-line" aria-hidden="true" />
                                                    Reviews are published after admin verification.
                                                </span>
                                                <div>
                                                    <button
                                                        type="button"
                                                        className="is-secondary"
                                                        onClick={() => {
                                                            setReviewFormOpen(false);
                                                            setReviewError("");
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button type="submit">
                                                        <i className="ri-send-plane-line" aria-hidden="true" />
                                                        Submit review
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    ) : null}

                                    {rankingReasons.length > 0 ? (
                                        <div className="homeojob-doctor-detail__why">
                                            <h3 className="homeojob-doctor-detail__why-title">
                                                <i className="ri-award-line" aria-hidden="true" />
                                                Why this doctor?
                                            </h3>
                                            <ul className="homeojob-doctor-detail__why-list">
                                                {rankingReasons.map((reason, idx) => (
                                                    <li key={idx}>
                                                        <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                                        {typeof reason === "string" ? reason : reason?.label || reason?.text || reason?.title || "—"}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}

                                    <div className="homeojob-doctor-detail__review-summary">
                                        <div className="homeojob-doctor-detail__review-score">
                                            <strong>{reviewSummary.average.toFixed(1)}</strong>
                                            <Stars value={reviewSummary.average} />
                                            <span>{reviewSummary.count} reviews</span>
                                        </div>
                                        <div className="homeojob-doctor-detail__review-bars">
                                            {reviewSummary.breakdown.map(({ star, total }) => (
                                                <div className="homeojob-doctor-detail__review-bar-row" key={star}>
                                                    <span>{star}</span>
                                                    <i className="ri-star-fill" aria-hidden="true" />
                                                    <span className="homeojob-doctor-detail__review-bar">
                                                        <span
                                                            style={{
                                                                width: `${reviewSummary.count ? (total / reviewSummary.count) * 100 : 0}%`,
                                                            }}
                                                        />
                                                    </span>
                                                    <span>{total}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <ul className="homeojob-doctor-detail__review-list">
                                        {displayReviews.map((review) => (
                                            <li className="homeojob-doctor-detail__review" key={review.id}>
                                                <span className="homeojob-doctor-detail__review-avatar" aria-hidden="true">
                                                    {review.initials}
                                                </span>
                                                <div className="homeojob-doctor-detail__review-body">
                                                    <div className="homeojob-doctor-detail__review-head">
                                                        <span className="homeojob-doctor-detail__review-name">
                                                            {review.name}
                                                            <span className="homeojob-doctor-detail__review-verified">
                                                                <i className="ri-shield-check-fill" aria-hidden="true" />
                                                                Verified visit
                                                            </span>
                                                        </span>
                                                        <span className="homeojob-doctor-detail__review-date">{review.date}</span>
                                                    </div>
                                                    <div className="homeojob-doctor-detail__review-meta">
                                                        <Stars value={review.rating} />
                                                        {review.mode ? <span>{review.mode}</span> : null}
                                                    </div>
                                                    <p className="homeojob-doctor-detail__review-text">{review.text}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activeTab === "articles" && (
                                <div className="homeojob-doctor-detail__content">
                                    <h2 className="homeojob-doctor-detail__section-title">Articles</h2>
                                    {articles.length === 0 ? (
                                    <p className="homeojob-doctor-detail__about">
                                        Health tips from {doctor.name} will appear here when published.
                                    </p>
                                    ) : (
                                        <ul className="mb-3">
                                            {articles.map((item) => {
                                                const id = item.blogId ?? item.BlogId;
                                                return (
                                                    <li key={id}>
                                                        <Link to={landingPath(`blog/${id}`)}>
                                                            {item.blogHead ?? item.BlogHead}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                    <Link
                                        to={landingPath("blog")}
                                        className="homeojob-doctor-detail__maps-link"
                                    >
                                        Browse Blog
                                        <i className="ri-arrow-right-line" aria-hidden="true" />
                                    </Link>
                                </div>
                            )}
                        </article>
                    </Col>

                    <Col lg={4} className="homeojob-doctor-detail__side">
                        <aside className="homeojob-doctor-detail__sidebar">
                            <div className="homeojob-doctor-detail__card homeojob-doctor-detail__booking">
                                <div className="homeojob-doctor-detail__booking-head">
                                    <i className="ri-calendar-check-line" aria-hidden="true" />
                                    <div>
                                        <h2>Book Your Consultation</h2>
                                        <p>Choose your preferred mode, date and time</p>
                                    </div>
                                </div>

                                <div className="homeojob-doctor-detail__mode">
                                    <button
                                        type="button"
                                        className={consultMode === "clinic" ? "is-active" : undefined}
                                        onClick={() => setConsultMode("clinic")}
                                    >
                                        In-Clinic | ₹ {doctor.inClinic}
                                    </button>
                                    <button
                                        type="button"
                                        className={consultMode === "tele" ? "is-active" : undefined}
                                        onClick={() => setConsultMode("tele")}
                                    >
                                        Tele Consultation | ₹ {doctor.tele}
                                    </button>
                                </div>

                                <label className="homeojob-doctor-detail__date">
                                    <i className="ri-calendar-line" aria-hidden="true" />
                                    <input
                                        type="date"
                                        min={toIsoDate(new Date())}
                                        value={dateValue}
                                        onChange={(e) => {
                                            const next = e.target.value ? new Date(`${e.target.value}T00:00:00`) : new Date();
                                            next.setHours(0, 0, 0, 0);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            if (next < today) return;
                                            setBookingDate(next);
                                        }}
                                        aria-label="Appointment date"
                                    />
                                </label>
                                <p className="text-muted small mb-2">{formatBookingDate(bookingDate)}</p>

                                <div className="homeojob-doctor-detail__slots">
                                    <h3>Available Slots</h3>
                                    <div className="homeojob-doctor-detail__slot-grid">
                                        {slots.length === 0 ? (
                                            <p className="text-muted small mb-0">No open slots for this date.</p>
                                        ) : (
                                        slots.map((slot) => {
                                            const value = slot.time || slot.label;
                                            return (
                                            <button
                                                key={value}
                                                type="button"
                                                className={
                                                    selectedSlot === value ? "is-active" : undefined
                                                }
                                                onClick={() => setSelectedSlot(value)}
                                            >
                                                {slot.label || value}
                                            </button>
                                            );
                                        })
                                        )}
                                    </div>
                                </div>

                                {slots.length === 0 ? (
                                    <WaitlistJoinPanel
                                        doctorId={doctor.id}
                                        requestedDate={bookingDate}
                                        consultMode={consultMode}
                                    />
                                ) : (
                                <div className="homeojob-doctor-detail__available">
                                    <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                    Doctor available today
                                </div>
                                )}

                                <button
                                    type="button"
                                    className="homeojob-doctor-detail__book"
                                    onClick={handleBook}
                                    disabled={!selectedSlot}
                                >
                                    Book Appointment
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </button>
                                <Link
                                    className="homeojob-doctor-detail__maps-link d-inline-block mt-2"
                                    to={`${landingPath(`book/${doctor.id}/slots`)}?mode=${consultMode}&date=${dateValue}`}
                                >
                                    Open full slot page
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </Link>
                            </div>

                            <div className="homeojob-doctor-detail__card homeojob-doctor-detail__clinic-info">
                                <div className="homeojob-doctor-detail__booking-head">
                                    <i className="ri-map-pin-2-fill" aria-hidden="true" />
                                    <div>
                                        <h2>Clinic Information</h2>
                                    </div>
                                </div>

                                <div className="homeojob-doctor-detail__clinic-grid">
                                    <div className="homeojob-doctor-detail__mini-map">
                                        <div className="homeojob-doctor-detail__mini-map-pin">
                                            <i className="ri-map-pin-2-fill" />
                                        </div>
                                        <a
                                            href={doctor.mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="homeojob-doctor-detail__maps-link"
                                        >
                                            View on Google Maps
                                            <i className="ri-external-link-line" aria-hidden="true" />
                                        </a>
                                    </div>

                                    <div className="homeojob-doctor-detail__clinic-meta">
                                        <p>
                                            <i className="ri-map-pin-line" aria-hidden="true" />
                                            <span>
                                                {doctor.clinicName}, {doctor.clinicAddress}
                                            </span>
                                        </p>
                                        <p>
                                            <i className="ri-time-line" aria-hidden="true" />
                                            <span>
                                                Mon - Sat, {doctor.timings.weekdays.replace(" | ", ", ")}
                                            </span>
                                        </p>
                                        <p>
                                            <i className="ri-phone-line" aria-hidden="true" />
                                            <span>{phone}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="homeojob-doctor-detail__badges">
                                    <span>In-Clinic Available</span>
                                    <span>Online Consultation Available</span>
                                </div>
                            </div>
                        </aside>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default DoctorDetailPage;
