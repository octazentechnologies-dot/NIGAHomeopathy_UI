import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { DOCTORS } from "../constants/doctorsData";
import BookingConfirmModal from "../components/BookingConfirmModal";
import {
    getPublicDoctor,
    getPublicDoctorRanking,
    getPublicDoctorSlots,
    listPublicArticles,
    mapPublicDoctorCard,
    toIsoDate,
} from "../../../../helpers/publicBookingApi";

const TABS = [
    { id: "overview", label: "Overview", icon: "ri-file-text-line" },
    { id: "clinic", label: "Clinic Details", icon: "ri-map-pin-line" },
    { id: "reviews", label: "Reviews", icon: "ri-star-line" },
    { id: "articles", label: "Articles", icon: "ri-article-line" },
];

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
    const mockDoctor = DOCTORS.find((doc) => String(doc.id) === String(doctorId)) || null;
    const [doctor, setDoctor] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [favorite, setFavorite] = useState(false);
    const [consultMode, setConsultMode] = useState("clinic");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingDate, setBookingDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [loadError, setLoadError] = useState("");
    const [articles, setArticles] = useState([]);

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
                    mapped.rankingReasons = ranking.reasons || ranking.rankingReasons || [];
                } catch {
                    // profile already has rankingSummary
                }
                setDoctor(mapped);
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
                const list = (payload.slots || payload.Slots || []).filter(
                    (slot) => (slot.status || slot.Status || "available") !== "booked"
                );
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
        if (!selectedSlot) return;
        setBookingOpen(true);
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
                                    <h2 className="homeojob-doctor-detail__section-title">
                                        Patient Reviews
                                    </h2>
                                    <p className="homeojob-doctor-detail__about mb-0">
                                        Rated <strong>{doctor.rating.toFixed(1)}</strong> from{" "}
                                        {doctor.reviews} verified reviews for clear guidance and
                                        compassionate care.
                                    </p>
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
                                        value={dateValue}
                                        onChange={(e) => {
                                            const next = e.target.value ? new Date(`${e.target.value}T00:00:00`) : new Date();
                                            next.setHours(0, 0, 0, 0);
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

                                <div className="homeojob-doctor-detail__available">
                                    <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                    Doctor available today
                                </div>

                                <button
                                    type="button"
                                    className="homeojob-doctor-detail__book"
                                    onClick={handleBook}
                                    disabled={!selectedSlot}
                                >
                                    Book Appointment
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </button>
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

            <BookingConfirmModal
                isOpen={bookingOpen}
                onClose={() => setBookingOpen(false)}
                doctor={doctor}
                consultMode={consultMode}
                bookingDate={bookingDate}
                selectedSlot={selectedSlot}
            />
        </section>
    );
};

export default DoctorDetailPage;
