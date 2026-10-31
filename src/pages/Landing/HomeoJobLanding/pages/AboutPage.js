import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { ABOUT_CONTENT, SITE, WHY_CHOOSE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import LandingPageHero from "../components/LandingPageHero";

const PILLARS = [
    { icon: "ri-leaf-line", tone: "green", label: "Easy Homeopathy" },
    { icon: "ri-stethoscope-line", tone: "blue", label: "Easy Practice" },
    { icon: "ri-search-eye-line", tone: "purple", label: "Easy Remedy Hunting" },
];

const WHY_TONES = ["blue", "green", "purple"];

const AboutPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | About Us`;
    }, []);

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    align="start"
                    breadcrumb="About"
                    eyebrow="Our Company"
                    title="About"
                    highlight="Homeocentrum"
                    subtitle="Classical homeopathy, digital case taking, and clinic tools in one cloud practice."
                />

                <Row className="g-4 align-items-stretch">
                    <Col lg={7}>
                        <div className="homeojob-page__panel">
                            <p className="homeojob-page__quote">{ABOUT_CONTENT.quote}</p>
                            <p className="homeojob-page__lead">{ABOUT_CONTENT.intro}</p>
                            <ul className="homeojob-page__points">
                                {ABOUT_CONTENT.bullets.map((item) => (
                                    <li key={item}>
                                        <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Col>
                    <Col lg={5}>
                        <aside className="homeojob-page__aside">
                            <span className="homeojob-page__aside-icon" aria-hidden="true">
                                <i className="ri-heart-pulse-line" />
                            </span>
                            <p className="homeojob-page__aside-note">{ABOUT_CONTENT.footerNote}</p>
                            <ul className="homeojob-page__pillars">
                                {PILLARS.map((item) => (
                                    <li key={item.label}>
                                        <span className={`homeojob-page__pillar-icon homeojob-page__pillar-icon--${item.tone}`}>
                                            <i className={item.icon} aria-hidden="true" />
                                        </span>
                                        {item.label}
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </Col>
                </Row>

                <div className="homeojob-page__block">
                    <div className="homeojob-page__block-head">
                        <p className="homeojob-page__eyebrow">{WHY_CHOOSE.title}</p>
                        <h2 className="homeojob-page__block-title">
                            Built for the <span className="text-primary">totality</span> of the case
                        </h2>
                        <p className="homeojob-page__subtitle">{WHY_CHOOSE.description}</p>
                    </div>
                    <Row className="g-3">
                        {WHY_CHOOSE.items.map((item, index) => (
                            <Col md={4} key={item.title}>
                                <article className="homeojob-page__feature">
                                    <span
                                        className={`homeojob-page__feature-icon homeojob-page__feature-icon--${WHY_TONES[index % WHY_TONES.length]}`}
                                    >
                                        <i className={item.icon} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.text}</p>
                                    </div>
                                </article>
                            </Col>
                        ))}
                    </Row>
                </div>

                <div className="homeojob-page__band">
                    <div>
                        <h2>{ABOUT_CONTENT.whatWeDo.title}</h2>
                        <p>{ABOUT_CONTENT.whatWeDo.text}</p>
                    </div>
                    <div className="homeojob-page__chips">
                        {ABOUT_CONTENT.whatWeDo.items.map((item) => (
                            <Link key={item} to={landingPath("features")}>
                                {item}
                            </Link>
                        ))}
                    </div>
                    <div className="homeojob-page__actions">
                        <Link to={landingPath("book")} className="homeojob-page__cta">
                            Find a doctor
                            <i className="ri-arrow-right-line" aria-hidden="true" />
                        </Link>
                        <Link to={landingPath("contact")} className="homeojob-page__cta homeojob-page__cta--ghost">
                            Contact us
                        </Link>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default AboutPage;
