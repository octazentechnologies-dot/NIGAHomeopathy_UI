import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Container, Form, Input, Row } from "reactstrap";

import HeroDoctor from "../../../assets/images/landing/hero-doctor.png";
import { HERO } from "../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../constants/landingRoutes";

const HERO_FEATURES = [
    { icon: "ri-hospital-line", label: "In-Clinic Consultation" },
    { icon: "ri-vidicon-line", label: "Online Consultation" },
    { icon: "ri-shield-check-line", label: "Verified Doctors" },
    { icon: "ri-shield-keyhole-line", label: "Secure Payments" },
];

const Home = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <section className="section job-hero-section homeojob-hero" id="hero">
            <Container>
                <Row className="align-items-center gy-5">
                    <Col lg={6} className="homeojob-hero-copy text-center text-lg-start">
                        <p className="homeojob-hero-eyebrow mb-2">Natural Healing. Brighter Tomorrows.</p>
                        <h1 className="homeojob-hero-title mb-3">
                            {HERO.title}{" "}
                            <span className="text-primary">{HERO.highlight}</span>
                        </h1>
                        <p className="homeojob-hero-subtitle mb-4">{HERO.subtitle}</p>

                        <Form
                            action="#"
                            className="homeojob-hero-search-bar"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const params = new URLSearchParams();
                                if (searchQuery.trim()) {
                                    params.set("q", searchQuery.trim());
                                }
                                const query = params.toString();
                                navigate(
                                    query
                                        ? `${landingPath("book")}?${query}`
                                        : landingPath("book")
                                );
                            }}
                        >
                            <Input
                                type="search"
                                name="hero-search"
                                id="hero-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-control homeojob-hero-search-bar__input"
                                placeholder="Search by doctor name, specialization or location"
                                aria-label="Search by doctor name, specialization or location"
                            />
                            <button className="btn btn-primary homeojob-hero-search-bar__btn" type="submit">
                                Search
                            </button>
                        </Form>

                        <div className="homeojob-hero-features">
                            {HERO_FEATURES.map((feature) => (
                                <div className="homeojob-hero-feature" key={feature.label}>
                                    <span className="homeojob-hero-feature__icon" aria-hidden="true">
                                        <i className={feature.icon} />
                                    </span>
                                    <span className="homeojob-hero-feature__label">{feature.label}</span>
                                </div>
                            ))}
                        </div>
                    </Col>

                    <Col lg={6}>
                        <div className="homeojob-hero-visual position-relative text-center mt-2 mt-lg-0">
                            <div className="homeojob-hero-leaf" aria-hidden="true" />
                            <img
                                src={HeroDoctor}
                                alt="Homeopathy care professional"
                                className="homeojob-hero-image"
                            />
                            <div className="homeojob-hero-badge" aria-hidden="true">
                                <span>Natural Healing for a Better Tomorrow</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default Home;
