import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import PlatformDoctor from "../../../assets/images/landing/platform-doctor.png";
import DoctorAvatar from "../../../assets/images/users/avatar-2.jpg";

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

const PLATFORM_STATS = [
    { value: "100+", label: "Trusted Practitioners" },
    { value: "50K+", label: "Cases Managed" },
    { value: "99%", label: "Practitioner Satisfaction" },
];

const Features = () => (
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

                        <div className="homeojob-platform-float homeojob-platform-float--trust">
                            <span className="homeojob-platform-float__icon homeojob-platform-float__icon--blue">
                                <i className="ri-group-line" />
                            </span>
                            <span>
                                Trusted by <strong>100+</strong> practitioners
                            </span>
                        </div>

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

                        <div className="homeojob-platform-float homeojob-platform-float--quote">
                            <img src={DoctorAvatar} alt="" className="homeojob-platform-float__avatar" />
                            <div>
                                <p>
                                    &ldquo;Homeocentrum has made my practice faster and more
                                    effective!&rdquo;
                                </p>
                                <div className="homeojob-platform-float__meta">
                                    <strong>Dr. Priya Shah</strong>
                                    <span className="homeojob-platform-float__stars" aria-hidden="true">
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                    </span>
                                </div>
                            </div>
                        </div>
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
                            {PLATFORM_STATS.map((stat) => (
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

export default Features;
