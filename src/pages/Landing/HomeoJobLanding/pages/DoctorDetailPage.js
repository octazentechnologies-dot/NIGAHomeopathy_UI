import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    getPublicDoctor,
    getPublicDoctorRanking,
    getPublicDoctorSlots,
    listPublicArticles,
    listPublicDoctorReviews,
    mapPublicDoctorCard,
    toIsoDate,
} from "../../../../helpers/publicBookingApi";
import WaitlistJoinPanel from "../components/WaitlistJoinPanel";

const TABS = [
    { id: "overview", label: "Overview", icon: "ri-file-text-line" },
    { id: "clinic", label: "Clinic Details", icon: "ri-map-pin-line" },
    { id: "reviews", label: "Reviews", icon: "ri-star-line" },
    { id: "articles", label: "Articles", icon: "ri-article-line" },
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
    const [doctor, setDoctor] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [favorite, setFavorite] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
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
    const [rankingReasons, setRankingReasons] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
        let cancelled = false;
        setLoadError("");
        getPublicDoctor(doctorId)
            .then(async (row) => {
                if (cancelled) return;
                const mapped = mapPublicDoctorCard(row);
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
                setLoadError("Doctor not found or not verified for directory.");
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

    const handleShare = async (profile) => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: `${profile.name} | ${SITE.name}`, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        } catch (_) {
            // Share sheet dismissed or clipboard blocked; nothing to undo.
        }
    };

    const phone = doctor.phone || "";
    const dateValue = toIsoDate(bookingDate);
    const displayReviews = reviews.map(normalizeReview);
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
                                <button
                                    type="button"
                                    aria-label="Share"
                                    title={shareCopied ? "Link copied" : "Share"}
                                    onClick={() => handleShare(doctor)}
                                >
                                    <i className={shareCopied ? "ri-check-line" : "ri-share-forward-line"} />
                                </button>
                                <a
                                    href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`Report doctor profile: ${doctor.name}`)}&body=${encodeURIComponent(`Profile: ${window.location.href}\n\nWhat is wrong with this profile?\n`)}`}
                                    aria-label="Report"
                                    title="Report this profile"
                                >
                                    <i className="ri-flag-line" />
                                </a>
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
                                        {doctor.languages ? (
                                            <span>
                                                <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                                {doctor.languages}
                                            </span>
                                        ) : null}
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
                                        <strong>Hours:</strong> {doctor.timings.weekdays || "See available slots on the right"}
                                    </p>
                                </div>
                            )}

                            {activeTab === "reviews" && (
                                <div className="homeojob-doctor-detail__content">
                                    <div className="homeojob-doctor-detail__reviews-head">
                                        <h2 className="homeojob-doctor-detail__section-title mb-0">
                                            Patient Reviews
                                        </h2>
                                    </div>
                                    <p className="text-muted small mb-3">
                                        <i className="ri-shield-check-line me-1" aria-hidden="true" />
                                        Reviews come from patients after a completed consultation and are published after admin verification.
                                    </p>


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

                                    {displayReviews.length === 0 ? (
                                        <p className="text-muted">No published reviews yet.</p>
                                    ) : null}
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
                                                {doctor.timings.weekdays ? doctor.timings.weekdays.replace(" | ", ", ") : "See available slots"}
                                            </span>
                                        </p>
                                        {phone ? (
                                            <p>
                                                <i className="ri-phone-line" aria-hidden="true" />
                                                <span>{phone}</span>
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="homeojob-doctor-detail__badges">
                                    {doctor.inClinic > 0 ? <span>In-Clinic Available</span> : null}
                                    {doctor.tele > 0 ? <span>Online Consultation Available</span> : null}
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
