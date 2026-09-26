import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { landingPath } from "../../../../constants/landingRoutes";
import { SITE } from "../constants/siteContent";
import {
    PRIVACY_HERO,
    PRIVACY_INTRO,
    PRIVACY_SECTIONS,
} from "../constants/privacyContent";
import { getPublicPolicy } from "../../../../helpers/publicBookingApi";

const PrivacyPage = () => {
    const [activeId, setActiveId] = useState(PRIVACY_SECTIONS[0].id);
    const [openId, setOpenId] = useState(PRIVACY_SECTIONS[0].id);

    const [policyMeta, setPolicyMeta] = useState(null);

    useEffect(() => {
        document.title = `${SITE.name} | Privacy & Policy`;
        window.scrollTo(0, 0);
        getPublicPolicy("Privacy")
            .then((row) => setPolicyMeta(row))
            .catch(() => setPolicyMeta(null));
    }, []);

    const handleNavClick = (id) => {
        setActiveId(id);
        setOpenId(id);
        const el = document.getElementById(`privacy-section-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const toggleSection = (id) => {
        setOpenId((prev) => (prev === id ? "" : id));
        setActiveId(id);
    };

    return (
        <div className="homeojob-privacy">
            <section className="homeojob-privacy__hero">
                <div className="homeojob-privacy__hero-leaf homeojob-privacy__hero-leaf--l" aria-hidden="true">
                    <i className="ri-leaf-fill" />
                </div>
                <div className="homeojob-privacy__hero-leaf homeojob-privacy__hero-leaf--r" aria-hidden="true">
                    <i className="ri-leaf-fill" />
                </div>

                <Container>
                    <Row className="align-items-center g-4">
                        <Col lg={7}>
                            <p className="homeojob-privacy__eyebrow">{PRIVACY_HERO.eyebrow}</p>
                            <h1 className="homeojob-privacy__title">{PRIVACY_HERO.title}</h1>
                            <p className="homeojob-privacy__subtitle">{PRIVACY_HERO.subtitle}</p>
                            {policyMeta && (
                                <p className="text-muted small mb-0">
                                    Policy version {policyMeta.version ?? policyMeta.Version}
                                    {(policyMeta.title || policyMeta.Title) ? ` — ${policyMeta.title ?? policyMeta.Title}` : ""}
                                </p>
                            )}
                            <nav className="homeojob-privacy__breadcrumb" aria-label="Breadcrumb">
                                <Link to={landingPath()}>
                                    <i className="ri-home-5-line" aria-hidden="true" />
                                    Home
                                </Link>
                                <span aria-hidden="true">&gt;</span>
                                <span>Privacy &amp; Policy</span>
                            </nav>
                        </Col>
                        <Col lg={5}>
                            <div className="homeojob-privacy__visual" aria-hidden="true">
                                <div className="homeojob-privacy__shield">
                                    <i className="ri-shield-keyhole-fill" />
                                </div>
                                {PRIVACY_HERO.chips.map((chip) => (
                                    <div
                                        key={chip.label}
                                        className={`homeojob-privacy__chip homeojob-privacy__chip--${chip.theme}`}
                                    >
                                        <span>
                                            <i className={chip.icon} />
                                        </span>
                                        {chip.label}
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="homeojob-privacy__body">
                <Container>
                    <Row className="g-4 g-xl-5">
                        <Col lg={3}>
                            <aside className="homeojob-privacy__sidebar">
                                <h2 className="homeojob-privacy__side-title">In this page</h2>
                                <nav className="homeojob-privacy__nav" aria-label="Privacy sections">
                                    {PRIVACY_SECTIONS.map((section, index) => (
                                        <button
                                            key={section.id}
                                            type="button"
                                            className={
                                                activeId === section.id
                                                    ? "homeojob-privacy__nav-item is-active"
                                                    : "homeojob-privacy__nav-item"
                                            }
                                            onClick={() => handleNavClick(section.id)}
                                        >
                                            <em>{index + 1}.</em>
                                            <span>{section.nav}</span>
                                        </button>
                                    ))}
                                </nav>

                                <div className="homeojob-privacy__help">
                                    <span className="homeojob-privacy__help-icon" aria-hidden="true">
                                        <i className="ri-customer-service-2-fill" />
                                    </span>
                                    <p>Still have questions? We&apos;re here to help.</p>
                                    <Link to={landingPath("contact")} className="homeojob-privacy__help-btn">
                                        Contact Us
                                        <i className="ri-arrow-right-line" aria-hidden="true" />
                                    </Link>
                                </div>
                            </aside>
                        </Col>

                        <Col lg={9}>
                            <div className="homeojob-privacy__content">
                                <div
                                    className="homeojob-privacy__intro"
                                    dangerouslySetInnerHTML={{ __html: PRIVACY_INTRO.html }}
                                />

                                <div className="homeojob-privacy__sections">
                                    {PRIVACY_SECTIONS.map((section) => {
                                        const isOpen = openId === section.id;
                                        return (
                                            <article
                                                key={section.id}
                                                id={`privacy-section-${section.id}`}
                                                className={`homeojob-privacy__card${isOpen ? " is-open" : ""}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="homeojob-privacy__card-head"
                                                    aria-expanded={isOpen}
                                                    onClick={() => toggleSection(section.id)}
                                                >
                                                    <span
                                                        className={`homeojob-privacy__card-icon homeojob-privacy__card-icon--${section.theme}`}
                                                        aria-hidden="true"
                                                    >
                                                        <i className={section.icon} />
                                                    </span>
                                                    <span className="homeojob-privacy__card-copy">
                                                        <strong>{section.title}</strong>
                                                        <small>{section.summary}</small>
                                                    </span>
                                                    <i
                                                        className={`ri-arrow-down-s-line homeojob-privacy__card-chevron${
                                                            isOpen ? " is-open" : ""
                                                        }`}
                                                        aria-hidden="true"
                                                    />
                                                </button>

                                                {isOpen && (
                                                    <div className="homeojob-privacy__card-body">
                                                        {section.html && (
                                                            <div
                                                                dangerouslySetInnerHTML={{
                                                                    __html: section.html,
                                                                }}
                                                            />
                                                        )}
                                                        {section.list && (
                                                            <ul>
                                                                {section.list.map((item) => (
                                                                    <li key={item}>
                                                                        <i
                                                                            className="ri-checkbox-circle-fill"
                                                                            aria-hidden="true"
                                                                        />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {section.after && (
                                                            <div
                                                                dangerouslySetInnerHTML={{
                                                                    __html: section.after,
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </div>
    );
};

export default PrivacyPage;
