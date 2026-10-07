import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { landingPath } from "../../../constants/landingRoutes";
import usePublicHighlights, { formatCount } from "./usePublicHighlights";

const TRUST_POINTS = [
    { id: "verified", icon: "ri-shield-check-line", label: "Verified Doctors" },
    { id: "secure", icon: "ri-shield-keyhole-line", label: "Secure Consultation" },
    { id: "privacy", icon: "ri-shield-user-line", label: "Your Privacy Protected" },
];

const STEPS = [
    { id: "describe", icon: "ri-chat-heart-line", title: "Share your symptoms", text: "Tell us how you feel in a few words." },
    { id: "match", icon: "ri-user-search-line", title: "Get matched instantly", text: "We connect you to an available doctor." },
    { id: "consult", icon: "ri-vidicon-line", title: "Consult on video", text: "Talk face-to-face and get your e-prescription." },
];

const InstantConsultation = () => {
    const highlights = usePublicHighlights();
    const online = Number(highlights?.onlineDoctors || 0);
    const availability = highlights
        ? [
              online > 0
                  ? { id: "online", icon: "ri-add-circle-line", label: `${formatCount(online)} Doctor${online === 1 ? "" : "s"} Online` }
                  : { id: "online", icon: "ri-time-line", label: "No doctor online right now. Book a slot instead." },
          ]
        : [];

    const stats = highlights
        ? [
              { id: "doctors", icon: "ri-stethoscope-line", value: formatCount(highlights.verifiedDoctors), label: "Verified homeopaths" },
              { id: "tele", icon: "ri-vidicon-line", value: formatCount(highlights.teleDoctors), label: "Offer tele consults" },
              highlights.averageRating != null && Number(highlights.reviewCount) > 0
                  ? {
                        id: "rating",
                        icon: "ri-star-smile-line",
                        value: `${Number(highlights.averageRating).toFixed(1)}/5`,
                        label: `Patient rating (${formatCount(highlights.reviewCount)})`,
                    }
                  : null,
          ].filter(Boolean)
        : [];

    const patientsConsulted = Number(highlights?.patientsConsulted || 0);

    return (
    <section className="section homeojob-instant-consult" id="instant-consultation">
        <span className="homeojob-instant-consult__blob homeojob-instant-consult__blob--left" aria-hidden="true" />
        <span className="homeojob-instant-consult__blob homeojob-instant-consult__blob--right" aria-hidden="true" />
        <span className="homeojob-instant-consult__float homeojob-instant-consult__float--pill" aria-hidden="true">
            <i className="ri-capsule-line" />
        </span>
        <span className="homeojob-instant-consult__float homeojob-instant-consult__float--heart" aria-hidden="true">
            <i className="ri-heart-pulse-line" />
        </span>
        <span className="homeojob-instant-consult__float homeojob-instant-consult__float--leaf" aria-hidden="true">
            <i className="ri-leaf-line" />
        </span>

        <Container className="position-relative">
            <Row className="align-items-center g-4">
                <Col lg={3} md={6} className="order-2 order-lg-1">
                    <div className="homeojob-instant-consult__side">
                        <p className="homeojob-instant-consult__side-eyebrow">How it works</p>
                        <h3 className="homeojob-instant-consult__side-title">Care in 3 simple steps</h3>
                        <ol className="homeojob-instant-consult__steps">
                            {STEPS.map((step, index) => (
                                <li className="homeojob-instant-consult__step" key={step.id}>
                                    <span className="homeojob-instant-consult__step-icon" aria-hidden="true">
                                        <i className={step.icon} />
                                        <span className="homeojob-instant-consult__step-num">{index + 1}</span>
                                    </span>
                                    <span>
                                        <span className="homeojob-instant-consult__step-title">{step.title}</span>
                                        <span className="homeojob-instant-consult__step-text">{step.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </Col>

                <Col lg={6} className="order-1 order-lg-2">
                    <div className="homeojob-instant-consult__card">
                        {online > 0 ? (
                            <span className="homeojob-instant-consult__live">
                                <span className="homeojob-instant-consult__live-dot" aria-hidden="true" />
                                Live now
                            </span>
                        ) : null}
                        <div className="homeojob-instant-consult__head">
                            <span className="homeojob-instant-consult__bolt" aria-hidden="true">
                                <i className="ri-flashlight-fill" />
                            </span>
                            <h2 className="homeojob-instant-consult__title">Need a Doctor Right Now?</h2>
                        </div>
                        <p className="homeojob-instant-consult__subtitle">
                            Connect with an available homeopathic doctor instantly.
                        </p>

                        <div className="homeojob-instant-consult__chips">
                            {availability.map((item) => (
                                <span className="homeojob-instant-consult__chip" key={item.id}>
                                    <i className={item.icon} aria-hidden="true" />
                                    {item.label}
                                </span>
                            ))}
                        </div>

                        <Link
                            to={`${landingPath("find-doctor")}?mode=instant`}
                            className="homeojob-instant-consult__cta"
                        >
                            <i className="ri-vidicon-line" aria-hidden="true" />
                            Start Instant Consultation
                        </Link>

                        <ul className="homeojob-instant-consult__trust">
                            {TRUST_POINTS.map((item) => (
                                <li className="homeojob-instant-consult__trust-item" key={item.id}>
                                    <span className="homeojob-instant-consult__trust-icon" aria-hidden="true">
                                        <i className={item.icon} />
                                    </span>
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </Col>

                <Col lg={3} md={6} className="order-3">
                    <div className="homeojob-instant-consult__side">
                        <div className="homeojob-instant-consult__stats">
                            {stats.map((stat) => (
                                <div className="homeojob-instant-consult__stat" key={stat.id}>
                                    <span className="homeojob-instant-consult__stat-icon" aria-hidden="true">
                                        <i className={stat.icon} />
                                    </span>
                                    <span>
                                        <span className="homeojob-instant-consult__stat-value">{stat.value}</span>
                                        <span className="homeojob-instant-consult__stat-label">{stat.label}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                        {patientsConsulted > 0 ? (
                            <div className="homeojob-instant-consult__patients">
                                <div className="homeojob-instant-consult__avatars">
                                    <span className="homeojob-instant-consult__avatars-more">
                                        {formatCount(patientsConsulted)}
                                    </span>
                                </div>
                                <p className="homeojob-instant-consult__patients-text">
                                    Patients with a completed consultation
                                </p>
                            </div>
                        ) : null}
                    </div>
                </Col>
            </Row>
        </Container>
    </section>
    );
};

export default InstantConsultation;
