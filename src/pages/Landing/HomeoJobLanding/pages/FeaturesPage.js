import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { FEATURE_MODULES, SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import LandingPageHero from "../components/LandingPageHero";

const MODULE_META = [
    { icon: "ri-stethoscope-line", tone: "blue" },
    { icon: "ri-bar-chart-grouped-line", tone: "green" },
    { icon: "ri-heart-pulse-line", tone: "purple" },
    { icon: "ri-time-line", tone: "orange" },
    { icon: "ri-book-open-line", tone: "blue" },
    { icon: "ri-line-chart-line", tone: "green" },
];

const FeaturesPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | Features`;
    }, []);

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    breadcrumb="Features"
                    eyebrow="Clinical Modules"
                    title="Homeocentrum"
                    highlight="Features"
                    subtitle="Case taking, repertorization, diagnosis, materia medica, timeline, and deep analytics in one practice platform."
                />

                <Row className="g-3">
                    {FEATURE_MODULES.map((mod, index) => {
                        const meta = MODULE_META[index % MODULE_META.length];
                        return (
                            <Col lg={6} key={mod.title}>
                                <article className="homeojob-page__module">
                                    <div className="homeojob-page__module-top">
                                        <span className={`homeojob-page__feature-icon homeojob-page__feature-icon--${meta.tone}`}>
                                            <i className={meta.icon} aria-hidden="true" />
                                        </span>
                                        <span className="homeojob-page__module-index">{String(index + 1).padStart(2, "0")}</span>
                                    </div>
                                    <h2>{mod.title}</h2>
                                    <p>{mod.text}</p>
                                </article>
                            </Col>
                        );
                    })}
                </Row>

                <div className="homeojob-page__band">
                    <div>
                        <h2>Ready to use these modules in clinic?</h2>
                        <p>Choose a practitioner plan, or book a consultation with a verified doctor.</p>
                    </div>
                    <div className="homeojob-page__actions">
                        <Link to={landingPath("pricing")} className="homeojob-page__cta">
                            View pricing
                            <i className="ri-arrow-right-line" aria-hidden="true" />
                        </Link>
                        <Link to={landingPath("book")} className="homeojob-page__cta homeojob-page__cta--ghost">
                            Book a visit
                        </Link>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default FeaturesPage;
