import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import JourneyStep1 from "../../../assets/images/landing/journey-step-1.png";
import JourneyStep2 from "../../../assets/images/landing/journey-step-2.png";
import JourneyStep3 from "../../../assets/images/landing/journey-step-3.png";
import { landingPath } from "../../../constants/landingRoutes";

const JOURNEY_STEPS = [
    {
        id: 1,
        theme: "mint",
        image: JourneyStep1,
        title: "Find Your Doctor",
        description:
            "Search by location, speciality or availability and choose the right homeopathy doctor for you.",
    },
    {
        id: 2,
        theme: "sky",
        image: JourneyStep2,
        title: "Consult Online",
        description:
            "Connect with your doctor instantly through secure video consultation from the comfort of home.",
    },
    {
        id: 3,
        theme: "peach",
        image: JourneyStep3,
        title: "Get Your Prescription",
        description:
            "Receive a digital prescription after your consultation. Easily download, share and order medicines.",
    },
];

const TRUST_ITEMS = [
    { icon: "ri-leaf-line", label: "Natural & Safe" },
    { icon: "ri-shield-cross-line", label: "Verified Doctors" },
    { icon: "ri-heart-pulse-line", label: "Personalized Care" },
];

const JourneySteps = () => (
    <section className="section homeojob-journey" id="journey">
        <Container>
            <div className="homeojob-journey__header">
                <p className="homeojob-journey__eyebrow">Simple Steps. Better Health.</p>
                <h2 className="homeojob-journey__title">
                    Your Homeopathy Care Journey in{" "}
                    <span className="text-primary">3 Simple Steps</span>
                </h2>
                <p className="homeojob-journey__subtitle">
                    Natural, safe and personalized care is just a few clicks away.
                </p>
            </div>

            <div className="homeojob-journey__steps">
                <Row className="g-4 g-xl-3 align-items-stretch">
                    {JOURNEY_STEPS.map((step, index) => (
                        <Col lg={4} md={6} key={step.id} className="d-flex">
                            <article className={`homeojob-journey-step homeojob-journey-step--${step.theme}`}>
                                {index < JOURNEY_STEPS.length - 1 ? (
                                    <div className="homeojob-journey-step__connector" aria-hidden="true">
                                        <span className="homeojob-journey-step__connector-line" />
                                        <span className="homeojob-journey-step__connector-arrow">
                                            <i className="ri-arrow-right-s-line" />
                                        </span>
                                    </div>
                                ) : null}
                                <div className="homeojob-journey-step__visual">
                                    {step.id === 1 ? (
                                        <Link
                                            to={landingPath("find-doctor")}
                                            className="homeojob-journey-step__image-link"
                                            aria-label="Search doctors"
                                        >
                                            <img
                                                src={step.image}
                                                alt=""
                                                className="homeojob-journey-step__image"
                                            />
                                        </Link>
                                    ) : (
                                        <img
                                            src={step.image}
                                            alt=""
                                            className="homeojob-journey-step__image"
                                        />
                                    )}
                                </div>
                                <h3 className="homeojob-journey-step__title">{step.title}</h3>
                                <p className="homeojob-journey-step__desc">{step.description}</p>
                            </article>
                        </Col>
                    ))}
                </Row>
            </div>

            <div className="homeojob-journey__cta-wrap">
                <Link to={landingPath("find-doctor")} className="btn homeojob-journey__cta">
                    Start Your Wellness Journey
                    <i className="ri-arrow-right-line" aria-hidden="true" />
                </Link>

                <div className="homeojob-journey__trust">
                    {TRUST_ITEMS.map((item) => (
                        <div className="homeojob-journey__trust-item" key={item.label}>
                            <i className={item.icon} aria-hidden="true" />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="homeojob-journey__flourish homeojob-journey__flourish--left" aria-hidden="true">
                <i className="ri-leaf-fill" />
                <span>Healing Naturally Together</span>
            </div>
            <div className="homeojob-journey__flourish homeojob-journey__flourish--right" aria-hidden="true">
                <span>Small Steps for a Healthier You</span>
            </div>
        </Container>
    </section>
);

export default JourneySteps;
