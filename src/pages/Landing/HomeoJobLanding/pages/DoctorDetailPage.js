import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getDoctorById } from "../constants/doctorsData";
import BookingConfirmModal from "../components/BookingConfirmModal";

const TABS = [
    { id: "overview", label: "Overview", icon: "ri-file-text-line" },
    { id: "clinic", label: "Clinic Details", icon: "ri-map-pin-line" },
    { id: "reviews", label: "Reviews", icon: "ri-star-line" },
    { id: "articles", label: "Articles", icon: "ri-article-line" },
];

const TIME_SLOTS = [
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
    "06:30 PM",
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
    const doctor = getDoctorById(doctorId);
    const [activeTab, setActiveTab] = useState("overview");
    const [favorite, setFavorite] = useState(false);
    const [consultMode, setConsultMode] = useState("clinic");
    const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
    const [bookingOpen, setBookingOpen] = useState(false);
    const bookingDate = useMemo(() => new Date(2026, 8, 18), []);

    useEffect(() => {
        document.title = `${doctor.name} | ${SITE.name}`;
        window.scrollTo(0, 0);
    }, [doctor.name]);

    const handleBook = () => {
        setBookingOpen(true);
    };

    const phone = doctor.phone || "+91 98765 43210";

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
                                    <p className="homeojob-doctor-detail__about">
                                        Health tips and clinic insights from {doctor.name} will appear
                                        here soon.
                                    </p>
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
                                        type="text"
                                        readOnly
                                        value={formatBookingDate(bookingDate)}
                                        aria-label="Appointment date"
                                    />
                                </label>

                                <div className="homeojob-doctor-detail__slots">
                                    <h3>Available Slots</h3>
                                    <div className="homeojob-doctor-detail__slot-grid">
                                        {TIME_SLOTS.map((slot) => (
                                            <button
                                                key={slot}
                                                type="button"
                                                className={
                                                    selectedSlot === slot ? "is-active" : undefined
                                                }
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot}
                                            </button>
                                        ))}
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
