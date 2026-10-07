import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import PlatformDoctor from "../../../assets/images/landing/platform-doctor.png";
import usePublicHighlights, { formatCount } from "./usePublicHighlights";

const PLATFORM_PILLARS = [
    {
        icon: "ri-time-line",
        tone: "green",
        title: "Time Minimization",
        text: "Manage cases faster and more efficiently.",
    },
    {
        icon: "ri-bar-chart-grouped-line",
        tone: "blue",
        title: "Homeopathic Evolutionary",
        text: "Stay updated with modern tools.",
    },
    {
        icon: "ri-stack-line",
        tone: "pink",
        title: "Layer Differentiation",
        text: "Advanced case analysis with deeper insights.",
    },
];

const Features = () => {
    const highlights = usePublicHighlights();
    const doctors = Number(highlights?.verifiedDoctors || 0);
    const latestReview = Array.isArray(highlights?.reviews) ? highlights.reviews[0] : null;
    const latestRating = Math.max(0, Math.min(5, Number(latestReview?.rating) || 0));
    const platformStats = highlights
        ? [
              { value: formatCount(doctors), label: "Verified Practitioners" },
              { value: formatCount(highlights.completedConsultations), label: "Consultations Completed" },
              highlights.averageRating != null && Number(highlights.reviewCount) > 0
                  ? { value: `${Number(highlights.averageRating).toFixed(1)}/5`, label: "Average Patient Rating" }
                  : null,
          ].filter(Boolean)
        : [];

    return (
    <section className="section homeojob-platform" id="platform">
        <Container>
            <Row className="align-items-center gy-5">
                <Col lg={6}>
                    <div className="homeojob-platform__visual">
                        <div className="homeojob-platform__blob" aria-hidden="true" />
                        <div className="homeojob-platform__ring" aria-hidden="true" />

                        <img
                            src={PlatformDoctor}
                            alt="Homeopathy practitioner"
                            className="homeojob-platform__image"
                        />

                        {doctors > 0 ? (
                            <div className="homeojob-platform-float homeojob-platform-float--trust">
                                <span className="homeojob-platform-float__icon homeojob-platform-float__icon--blue">
                                    <i className="ri-group-line" />
                                </span>
                                <span>
                                    <strong>{formatCount(doctors)}</strong> verified practitioner{doctors === 1 ? "" : "s"}
                                </span>
                            </div>
                        ) : null}

                        <div className="homeojob-platform-float homeojob-platform-float--natural">
                            <span className="homeojob-platform-float__icon homeojob-platform-float__icon--green">
                                <i className="ri-leaf-line" />
                            </span>
                            <span>
                                <strong>Natural</strong> &amp; Safe Care
                            </span>
                        </div>

                        <div className="homeojob-platform-float homeojob-platform-float--time">
                            <span className="homeojob-platform-float__icon homeojob-platform-float__icon--blue">
                                <i className="ri-time-line" />
                            </span>
                            <span>
                                <strong>Save Time</strong> Practice Better
                            </span>
                        </div>

                        <div className="homeojob-platform-float homeojob-platform-float--remedy">
                            <h4>Find the Right Remedy</h4>
                            <div className="homeojob-platform-float__search">
                                <i className="ri-search-line" />
                                <span>Search symptoms, rubrics...</span>
                            </div>
                            <ul>
                                <li>
                                    <i className="ri-checkbox-circle-fill" />
                                    Accurate Results
                                </li>
                                <li>
                                    <i className="ri-checkbox-circle-fill" />
                                    Multi-lingual Support
                                </li>
                                <li>
                                    <i className="ri-checkbox-circle-fill" />
                                    Evidence Based
                                </li>
                            </ul>
                        </div>

                        {latestReview ? (
                            <div className="homeojob-platform-float homeojob-platform-float--quote">
                                <span
                                    className="homeojob-platform-float__avatar d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                                    aria-hidden="true"
                                >
                                    <i className="ri-user-heart-line" />
                                </span>
                                <div>
                                    <p className="text-truncate" style={{ maxWidth: 220 }} title={latestReview.text}>
                                        &ldquo;{latestReview.text}&rdquo;
                                    </p>
                                    <div className="homeojob-platform-float__meta">
                                        <strong>Verified patient</strong>
                                        <span className="homeojob-platform-float__stars" aria-label={`${latestRating} star rating`}>
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <i key={i} className={i < latestRating ? "ri-star-fill" : "ri-star-line"} />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Col>

                <Col lg={6}>
                    <div className="homeojob-platform__copy">
                        <p className="homeojob-platform__eyebrow">All-in-One Practice Platform</p>
                        <h2 className="homeojob-platform__title">
                            Find your <span className="text-primary">Homeocentrum</span> practice
                            platform in one place
                        </h2>
                        <p className="homeojob-platform__desc">
                            Homeocentrum is a fully responsive cloud based homeopathic health
                            management system built for beginner and master practitioners.
                        </p>

                        <blockquote className="homeojob-platform__quote">
                            &ldquo;Efficient and Certain way of practicing Homeopathy.&rdquo;
                        </blockquote>

                        <div className="homeojob-platform__pillars">
                            {PLATFORM_PILLARS.map((item) => (
                                <div className="homeojob-platform__pillar" key={item.title}>
                                    <span
                                        className={`homeojob-platform__pillar-icon homeojob-platform__pillar-icon--${item.tone}`}
                                        aria-hidden="true"
                                    >
                                        <i className={item.icon} />
                                    </span>
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="homeojob-platform__actions">
                            <Link to="/register" className="btn homeojob-platform__cta">
                                Get Started
                                <i className="ri-arrow-right-line" aria-hidden="true" />
                            </Link>
                            <a href="#process" className="homeojob-platform__watch">
                                <span className="homeojob-platform__watch-icon" aria-hidden="true">
                                    <i className="ri-play-fill" />
                                </span>
                                Watch How It Works
                            </a>
                        </div>

                        <div className="homeojob-platform__stats">
                            {platformStats.map((stat) => (
                                <div className="homeojob-platform__stat" key={stat.label}>
                                    <strong>{stat.value}</strong>
                                    <span>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    </section>
    );
};

export default Features;
