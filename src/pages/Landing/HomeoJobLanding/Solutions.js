import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { landingPath } from "../../../constants/landingRoutes";
import TelemedicineVisual from "../../../assets/images/landing/solution-telemedicine.png";
import ErxVisual from "../../../assets/images/landing/solution-erx.png";
import HomeomedsVisual from "../../../assets/images/landing/solution-homeomeds.png";

const SOLUTIONS = [
    {
        id: "telemedicine",
        theme: "blue",
        icon: "ri-heart-pulse-fill",
        title: "Hello Homeo",
        description: "Consult qualified homeopathy doctors from the comfort of your home.",
        points: [
            { icon: "ri-vidicon-line", text: "HD video consultation" },
            { icon: "ri-time-line", text: "Flexible timings & waiting room" },
            { icon: "ri-shield-check-line", text: "Secure & private consultation" },
            { icon: "ri-chat-3-line", text: "In-call chat & consultation summary" },
        ],
        visual: TelemedicineVisual,
        badge: {
            type: "dot",
            title: "Quality Care",
            subtitle: "Anytime, Anywhere",
        },
    },
    {
        id: "erx",
        theme: "green",
        icon: "ri-file-text-fill",
        title: "Digital Prescription (eRx)",
        description: "Get a secure, structured and digitally signed prescription for safe and easy access.",
        points: [
            { icon: "ri-file-text-line", text: "Structured prescription with potency" },
            { icon: "ri-lock-2-line", text: "Digitally signed & tamper-proof" },
            { icon: "ri-eye-line", text: "View instantly in app (print / PDF)" },
            { icon: "ri-refresh-line", text: "Easy repeat prescriptions" },
        ],
        visual: ErxVisual,
        badge: null,
    },
    {
        id: "homeomeds",
        theme: "orange",
        icon: "ri-capsule-fill",
        title: "Homeo Meds",
        description: "Get your prescribed medicines delivered through our licensed pharmacy network.",
        points: [
            { icon: "ri-group-line", text: "Verified pharmacy partners" },
            { icon: "ri-truck-line", text: "Home delivery with tracking" },
            { icon: "ri-bank-card-line", text: "Pay online or cash on delivery" },
            { icon: "ri-repeat-line", text: "Easy refill orders" },
        ],
        visual: HomeomedsVisual,
        badge: {
            type: "icon",
            icon: "ri-truck-line",
            title: "Trusted Network",
            subtitle: "Pan-India Delivery",
        },
    },
];

const TRUST_ITEMS = [
    {
        icon: "ri-shield-check-line",
        tone: "blue",
        content: (
            <>
                Trusted by <strong>50K+</strong> Patients
            </>
        ),
    },
    {
        icon: "ri-group-line",
        tone: "blue",
        content: (
            <>
                <strong>500+</strong> Verified Doctors
            </>
        ),
    },
    {
        icon: "ri-leaf-line",
        tone: "green",
        content: <>Safe. Natural. Personalized.</>,
    },
];

const Solutions = () => (
    <section className="section homeojob-solutions" id="solutions">
        <Container>
            <div className="homeojob-solutions__header">
                <p className="homeojob-solutions__eyebrow">Our Solutions</p>
                <div className="homeojob-solutions__title-row">
                    <div
                        className="homeojob-solutions__flourish homeojob-solutions__flourish--left"
                        aria-hidden="true"
                    >
                        <span>
                            Practice Made
                            <br />
                            Simple
                        </span>
                        <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M2 16C28 6 68 2 102 10C108 12 112 14 116 12"
                                stroke="#3d9b6a"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M108 6L117 12L108 18"
                                stroke="#3d9b6a"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h2 className="homeojob-solutions__title">
                        Complete Homeopathy Care,{" "}
                        <span className="text-primary">All in One Place</span>
                    </h2>
                    <div
                        className="homeojob-solutions__flourish homeojob-solutions__flourish--right"
                        aria-hidden="true"
                    >
                        <span>
                            Care Beyond
                            <br />
                            Boundaries
                        </span>
                        <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M2 16C28 6 68 2 102 10C108 12 112 14 116 12"
                                stroke="#3d9b6a"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M108 6L117 12L108 18"
                                stroke="#3d9b6a"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
                <p className="homeojob-solutions__subtitle">
                    From online consultation to digital <strong>prescriptions</strong> and{" "}
                    <strong>medicine delivery</strong> — Homeocentrum brings modern technology to
                    traditional homeopathy care.
                </p>
            </div>

            <Row className="g-4 homeojob-solutions__cards">
                {SOLUTIONS.map((item) => (
                    <Col lg={4} md={6} key={item.id} className="d-flex">
                        <article
                            id={item.id}
                            className={`homeojob-solution-card homeojob-solution-card--${item.theme}`}
                        >
                            <div className="homeojob-solution-card__top">
                                <div className="homeojob-solution-card__icon" aria-hidden="true">
                                    <i className={item.icon} />
                                </div>
                                <h3 className="homeojob-solution-card__title">{item.title}</h3>
                                <p className="homeojob-solution-card__desc">{item.description}</p>
                            </div>

                            <div className="homeojob-solution-card__body">
                                <ul className="homeojob-solution-card__points">
                                    {item.points.map((point) => (
                                        <li key={point.text}>
                                            <i className={point.icon} aria-hidden="true" />
                                            <span>{point.text}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to={landingPath("features")} className="homeojob-solution-card__cta">
                                    Learn More <i className="ri-arrow-right-line" aria-hidden="true" />
                                </Link>
                            </div>

                            <div className="homeojob-solution-card__visual">
                                {item.badge ? (
                                    <div className={`homeojob-solution-card__badge homeojob-solution-card__badge--${item.theme}`}>
                                        {item.badge.type === "dot" ? (
                                            <span className="homeojob-solution-card__badge-dot" aria-hidden="true" />
                                        ) : (
                                            <i className={item.badge.icon} aria-hidden="true" />
                                        )}
                                        <span>
                                            <strong>{item.badge.title}</strong>
                                            <small>{item.badge.subtitle}</small>
                                        </span>
                                    </div>
                                ) : null}
                                <img
                                    src={item.visual}
                                    alt=""
                                    className={`homeojob-solution-card__image homeojob-solution-card__image--${item.id}`}
                                />
                            </div>
                        </article>
                    </Col>
                ))}
            </Row>

            <div className="homeojob-solutions__trust">
                {TRUST_ITEMS.map((item, index) => (
                    <div className="homeojob-solutions__trust-item" key={index}>
                        <i className={`${item.icon} homeojob-solutions__trust-icon--${item.tone}`} aria-hidden="true" />
                        <span>{item.content}</span>
                    </div>
                ))}
            </div>
        </Container>
    </section>
);

export default Solutions;
