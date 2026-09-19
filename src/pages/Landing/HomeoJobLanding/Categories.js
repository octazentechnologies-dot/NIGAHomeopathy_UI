import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";
import CtaDoctorImage from "../../../assets/images/landing/cta-doctor.png";
import { MODULE_CATEGORIES } from "./constants/jobLandingContent";

const Categories = () => (
    <>
        <section className="section homeojob-modules" id="categories">
            <div className="homeojob-modules__dots homeojob-modules__dots--tl" aria-hidden="true" />
            <div className="homeojob-modules__dots homeojob-modules__dots--tr" aria-hidden="true" />

            <Container className="position-relative">
                <div className="homeojob-modules__header">
                    <p className="homeojob-modules__eyebrow">Cloud Homeopathy</p>
                    <h2 className="homeojob-modules__title">
                        Cloud Homeopathy <span className="text-primary">Modules</span> Featured
                    </h2>
                    <p className="homeojob-modules__subtitle">
                        Case taking, repertorization, diagnosis master, materia medica, and deep
                        analytics in one platform.
                    </p>
                </div>

                <Row className="g-3 g-xl-4 homeojob-modules__grid">
                    {MODULE_CATEGORIES.map((item) => (
                        <Col lg={3} md={6} sm={6} key={item.label} className="d-flex">
                            <article
                                className={`homeojob-module-card homeojob-module-card--${item.theme}`}
                            >
                                <span className="homeojob-module-card__dots" aria-hidden="true" />
                                <div
                                    className="homeojob-module-card__icon"
                                    aria-hidden="true"
                                >
                                    <i className={item.icon} />
                                </div>
                                <h3 className="homeojob-module-card__title">{item.label}</h3>
                                <p className="homeojob-module-card__detail">{item.detail}</p>
                                <Link
                                    to="/register"
                                    className="homeojob-module-card__action"
                                    aria-label={`Explore ${item.label}`}
                                >
                                    <i className="ri-arrow-right-line" />
                                </Link>
                            </article>
                        </Col>
                    ))}
                </Row>

                <div className="homeojob-modules__flourishes">
                    <div className="homeojob-modules__flourish homeojob-modules__flourish--bl" aria-hidden="true">
                        <i className="ri-leaf-fill" />
                        <span>Smarter Homeopathy Together</span>
                    </div>
                    <div className="homeojob-modules__flourish homeojob-modules__flourish--br" aria-hidden="true">
                        <span>Better Health Naturally</span>
                    </div>
                </div>
            </Container>
        </section>

        <section className="section homeojob-cta" id="get-started">
            <Container>
                <div className="homeojob-cta__panel">
                    <div className="homeojob-cta__shape homeojob-cta__shape--1" aria-hidden="true" />
                    <div className="homeojob-cta__shape homeojob-cta__shape--2" aria-hidden="true" />
                    <div className="homeojob-cta__dots" aria-hidden="true" />

                    <div className="homeojob-cta__layout">
                        <div className="homeojob-cta__copy">
                            <p className="homeojob-cta__eyebrow">
                                Take the First Step Today
                                <span />
                            </p>
                            <h2 className="homeojob-cta__title">Ready to Started?</h2>
                            <p className="homeojob-cta__subtitle">
                                Create new account and start your Homeocentrum practice
                            </p>

                            <div className="homeojob-cta__features">
                                <div className="homeojob-cta__feature">
                                    <span className="homeojob-cta__feature-icon homeojob-cta__feature-icon--blue">
                                        <i className="ri-flashlight-fill" />
                                    </span>
                                    <div>
                                        <strong>Quick Setup</strong>
                                        <span>Get started in minutes</span>
                                    </div>
                                </div>
                                <div className="homeojob-cta__feature">
                                    <span className="homeojob-cta__feature-icon homeojob-cta__feature-icon--green">
                                        <i className="ri-shield-check-fill" />
                                    </span>
                                    <div>
                                        <strong>Secure &amp; Reliable</strong>
                                        <span>Your data is always safe</span>
                                    </div>
                                </div>
                                <div className="homeojob-cta__feature">
                                    <span className="homeojob-cta__feature-icon homeojob-cta__feature-icon--purple">
                                        <i className="ri-cloud-fill" />
                                    </span>
                                    <div>
                                        <strong>All-in-One Platform</strong>
                                        <span>Manage everything easily</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="homeojob-cta__visual">
                            <img
                                src={CtaDoctorImage}
                                alt="Homeopathy practitioner"
                                className="homeojob-cta__image"
                            />
                            <div className="homeojob-cta__leaves" aria-hidden="true">
                                <i className="ri-leaf-fill" />
                                <i className="ri-leaf-fill" />
                                <i className="ri-leaf-fill" />
                            </div>
                        </div>

                        <div className="homeojob-cta__action">
                            <span className="homeojob-cta__spark" aria-hidden="true" />
                            <Link to="/register" className="btn homeojob-cta__btn">
                                Create Free Account
                                <i className="ri-arrow-right-line" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    </>
);

export default Categories;
