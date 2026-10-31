import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { landingPath } from "../../../../constants/landingRoutes";
import { SITE } from "../constants/siteContent";

const LegalPolicyView = ({ audiences, sectionPrefix, shieldIcon, navLabel, className = "" }) => {
    const [params, setParams] = useSearchParams();
    const requested = params.get("audience");
    const audience = audiences.find((item) => item.id === requested) || audiences[0];
    const [activeId, setActiveId] = useState(audience.sections[0].id);
    const [openId, setOpenId] = useState(audience.sections[0].id);
    const [trackedAudienceId, setTrackedAudienceId] = useState(audience.id);

    if (trackedAudienceId !== audience.id) {
        setTrackedAudienceId(audience.id);
        setActiveId(audience.sections[0].id);
        setOpenId(audience.sections[0].id);
    }

    useEffect(() => {
        document.title = `${SITE.name} | ${audience.hero.title}`;
        window.scrollTo(0, 0);
    }, [audience]);

    const selectAudience = (id) => {
        setParams({ audience: id }, { replace: true });
    };

    const handleNavClick = (id) => {
        setActiveId(id);
        setOpenId(id);
        const el = document.getElementById(`${sectionPrefix}-section-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const toggleSection = (id) => {
        setOpenId((prev) => (prev === id ? "" : id));
        setActiveId(id);
    };

    return (
        <div className={`homeojob-privacy ${className}`.trim()}>
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
                            <p className="homeojob-privacy__eyebrow">{audience.hero.eyebrow}</p>
                            <h1 className="homeojob-privacy__title">{audience.hero.title}</h1>
                            <p className="homeojob-privacy__subtitle">{audience.hero.subtitle}</p>
                            <div className="homeojob-privacy__audiences" role="tablist" aria-label="Choose a policy">
                                {audiences.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={item.id === audience.id}
                                        className={
                                            item.id === audience.id
                                                ? "homeojob-privacy__audience is-active"
                                                : "homeojob-privacy__audience"
                                        }
                                        onClick={() => selectAudience(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <nav className="homeojob-privacy__breadcrumb" aria-label="Breadcrumb">
                                <Link to={landingPath()}>
                                    <i className="ri-home-5-line" aria-hidden="true" />
                                    Home
                                </Link>
                                <span aria-hidden="true">&gt;</span>
                                <span>{audience.hero.title}</span>
                            </nav>
                        </Col>
                        <Col lg={5}>
                            <div className="homeojob-privacy__visual" aria-hidden="true">
                                <div className="homeojob-privacy__shield">
                                    <i className={shieldIcon} />
                                </div>
                                {audience.hero.chips.map((chip) => (
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
                                <nav className="homeojob-privacy__nav" aria-label={navLabel}>
                                    {audience.sections.map((section, index) => (
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
                                            <span>{String(section.title || "").replace(/^\d+\.\s*/, "")}</span>
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
                                    dangerouslySetInnerHTML={{ __html: audience.intro.html }}
                                />

                                <div className="homeojob-privacy__sections">
                                    {audience.sections.map((section) => {
                                        const isOpen = openId === section.id;
                                        return (
                                            <article
                                                key={section.id}
                                                id={`${sectionPrefix}-section-${section.id}`}
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

                                                {isOpen && section.html && (
                                                    <div className="homeojob-privacy__card-body">
                                                        <div dangerouslySetInnerHTML={{ __html: section.html }} />
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

export default LegalPolicyView;
