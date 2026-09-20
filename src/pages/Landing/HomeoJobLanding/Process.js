import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

const HOW_STEPS = [
    {
        id: 1,
        theme: "blue",
        title: "Register Account",
        description:
            "Create your Homeocentrum account, verify your profile, then choose a plan that fits your clinic size and practice goals.",
        cta: "Get Started",
        to: "/register",
        visual: "register",
    },
    {
        id: 2,
        theme: "green",
        title: "Case Taking",
        description:
            "Capture patient history with smart, guided forms, structured rubrics and keyword-based symptoms that keep every case complete.",
        cta: "Start Case",
        to: "/register",
        visual: "case",
    },
    {
        id: 3,
        theme: "orange",
        title: "Repertorize",
        description:
            "Use graphical remedy scoring and multi-lingual rubric search to compare differentials with greater clinical confidence.",
        cta: "Explore Remedies",
        to: "/register",
        visual: "repertory",
    },
    {
        id: 4,
        theme: "purple",
        title: "Prescribe & Track",
        description:
            "Finalize remedies with materia medica support and deep analytics that guide follow-up care and patient outcomes.",
        cta: "Create Prescription",
        to: "/register",
        visual: "prescribe",
    },
];

const TRUST_ITEMS = [
    { icon: "ri-shield-check-line", label: "Secure & Private", tone: "blue" },
    { icon: "ri-leaf-line", label: "Natural & Evidence-Based", tone: "green" },
    { icon: "ri-bar-chart-box-line", label: "Data-Informed", tone: "orange" },
    { icon: "ri-group-line", label: "Trusted by Practitioners", tone: "blue" },
];

const StepVisual = ({ type }) => {
    if (type === "register") {
        return (
            <div className="how-visual how-visual--register" aria-hidden="true">
                <div className="how-visual__device">
                    <div className="how-visual__screen">
                        <div className="how-visual__avatar">
                            <i className="ri-user-3-fill" />
                        </div>
                        <div className="how-visual__field" />
                        <div className="how-visual__field how-visual__field--short" />
                        <div className="how-visual__btn-chip">Sign Up</div>
                    </div>
                </div>
                <div className="how-visual__float how-visual__float--login">
                    <div className="how-visual__float-avatar">
                        <i className="ri-user-line" />
                    </div>
                    <div className="how-visual__float-lines">
                        <span />
                        <span />
                    </div>
                </div>
            </div>
        );
    }

    if (type === "case") {
        return (
            <div className="how-visual how-visual--case" aria-hidden="true">
                <div className="how-visual__clipboard">
                    <div className="how-visual__clip" />
                    <div className="how-visual__clip-title">Patient Case</div>
                    <ul className="how-visual__checks">
                        <li>
                            <i className="ri-checkbox-circle-fill" />
                            <span />
                        </li>
                        <li>
                            <i className="ri-checkbox-circle-fill" />
                            <span />
                        </li>
                        <li>
                            <i className="ri-checkbox-circle-fill" />
                            <span />
                        </li>
                    </ul>
                </div>
                <span className="how-visual__tag how-visual__tag--blue">Symptoms</span>
                <span className="how-visual__tag how-visual__tag--green">History</span>
                <span className="how-visual__tag how-visual__tag--yellow">Lifestyle</span>
                <span className="how-visual__tag how-visual__tag--purple">Family History</span>
            </div>
        );
    }

    if (type === "repertory") {
        return (
            <div className="how-visual how-visual--repertory" aria-hidden="true">
                <div className="how-visual__badge">
                    <i className="ri-leaf-fill" />
                    Best Match with Confidence
                </div>
                <div className="how-visual__laptop">
                    <div className="how-visual__laptop-screen">
                        <div className="how-visual__bars">
                            <span style={{ height: "42%" }} />
                            <span style={{ height: "68%" }} />
                            <span style={{ height: "88%" }} />
                            <span style={{ height: "55%" }} />
                            <span style={{ height: "72%" }} />
                        </div>
                    </div>
                    <div className="how-visual__laptop-base" />
                </div>
            </div>
        );
    }

    return (
        <div className="how-visual how-visual--prescribe" aria-hidden="true">
            <div className="how-visual__rx">
                <div className="how-visual__rx-mark">Rx</div>
                <div className="how-visual__rx-lines">
                    <span />
                    <span />
                    <span />
                </div>
                <i className="ri-leaf-line how-visual__rx-leaf" />
            </div>
            <div className="how-visual__checklist">
                <div className="how-visual__check-row">
                    <i className="ri-checkbox-circle-fill" />
                    Prescribe
                </div>
                <div className="how-visual__check-row">
                    <i className="ri-checkbox-circle-fill" />
                    Share
                </div>
                <div className="how-visual__check-row">
                    <i className="ri-checkbox-circle-fill" />
                    Track Progress
                </div>
            </div>
        </div>
    );
};

const Process = () => (
    <section className="section homeojob-how" id="process">
        <Container>
            <div className="homeojob-how__header">
                <p className="homeojob-how__eyebrow">How It Works</p>
                <h2 className="homeojob-how__title">
                    Your Homeopathy Care, <span className="text-primary">Step by Step</span>
                </h2>
                <p className="homeojob-how__subtitle">
                    From registration to prescription — a simple and seamless workflow for better, natural health.
                </p>
            </div>

            <div className="homeojob-how__steps">
                <Row className="g-3 g-xl-4 align-items-stretch">
                    {HOW_STEPS.map((step, index) => (
                        <Col xl={3} lg={6} md={6} key={step.id} className="d-flex">
                            <div className={`homeojob-how-card homeojob-how-card--${step.theme}`}>
                                {index < HOW_STEPS.length - 1 ? (
                                    <div className="homeojob-how-card__connector" aria-hidden="true">
                                        <span className="homeojob-how-card__connector-line" />
                                        <span className="homeojob-how-card__connector-arrow">
                                            <i className="ri-arrow-right-s-line" />
                                        </span>
                                    </div>
                                ) : null}
                                <div className="homeojob-how-card__body">
                                    <div className="homeojob-how-card__badge">{step.id}</div>
                                    <h3 className="homeojob-how-card__title">{step.title}</h3>
                                    <p className="homeojob-how-card__desc">{step.description}</p>
                                    <Link to={step.to} className="homeojob-how-card__cta">
                                        {step.cta}
                                        <i className="ri-arrow-right-line" aria-hidden="true" />
                                    </Link>
                                    <StepVisual type={step.visual} />
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>

            <div className="homeojob-how__trust">
                {TRUST_ITEMS.map((item) => (
                    <div className="homeojob-how__trust-item" key={item.label}>
                        <i className={`${item.icon} homeojob-how__trust-icon--${item.tone}`} aria-hidden="true" />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="homeojob-how__cta-wrap">
                <Link to="/register" className="btn homeojob-how__cta">
                    Start Your Journey Today
                    <i className="ri-arrow-right-line" aria-hidden="true" />
                </Link>
            </div>

            <div className="homeojob-how__flourish homeojob-how__flourish--left" aria-hidden="true">
                <i className="ri-leaf-fill" />
                <span>Better Health Naturally</span>
            </div>
            <div className="homeojob-how__flourish homeojob-how__flourish--right" aria-hidden="true">
                <span>Homeopathy for a Brighter Tomorrow</span>
            </div>
        </Container>
    </section>
);

export default Process;
