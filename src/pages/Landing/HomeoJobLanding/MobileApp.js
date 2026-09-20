import React, { useState } from "react";
import { Col, Container, Row } from "reactstrap";
import PhoneVisual from "../../../assets/images/landing/mobile-app-phone.png";
import { SITE } from "../Minimaltheme/constants/siteContent";

const FEATURES = [
    {
        icon: "ri-vidicon-fill",
        label: "Video Consultation with Top Doctors",
        theme: "blue",
    },
    {
        icon: "ri-time-fill",
        label: "Available 24/7",
        theme: "green",
    },
    {
        icon: "ri-shield-check-fill",
        label: "Secure & Reliable",
        theme: "purple",
    },
];

const MobileApp = () => {
    const [phone, setPhone] = useState("");

    const handleSendSms = (event) => {
        event.preventDefault();
    };

    return (
        <section className="section homeojob-mobile" id="mobile-app">
            <div className="homeojob-mobile__dots" aria-hidden="true" />
            <div className="homeojob-mobile__note homeojob-mobile__note--br" aria-hidden="true">
                <span>Your Health Our Priority</span>
            </div>

            <Container className="position-relative">
                <Row className="align-items-center g-4 g-xl-5">
                    <Col lg={5} className="homeojob-mobile__visual-col">
                        <div className="homeojob-mobile__visual">
                            <img
                                src={PhoneVisual}
                                alt={`${SITE.name} mobile app — consult top homeopathic doctors`}
                                className="homeojob-mobile__phone"
                            />
                        </div>
                    </Col>

                    <Col lg={7}>
                        <div className="homeojob-mobile__content">
                            <p className="homeojob-mobile__eyebrow">
                                <i className="ri-smartphone-line" aria-hidden="true" />
                                Mobile App
                            </p>

                            <h2 className="homeojob-mobile__title">
                                Download the{" "}
                                <span className="text-primary">{SITE.name} App</span>
                            </h2>

                            <p className="homeojob-mobile__subtitle">
                                Access video consultation with India&apos;s top homeopathic doctors
                                on the {SITE.name} app. Connect with doctors online, available 24/7,
                                from the comfort of your home.
                            </p>

                            <form className="homeojob-mobile__sms" onSubmit={handleSendSms}>
                                <div className="homeojob-mobile__sms-code" aria-hidden="true">
                                    +91
                                    <i className="ri-arrow-down-s-line" />
                                </div>
                                <input
                                    type="tel"
                                    className="homeojob-mobile__sms-input"
                                    placeholder="Enter your phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    aria-label="Phone number"
                                />
                                <button type="submit" className="homeojob-mobile__sms-btn">
                                    Send SMS
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </button>
                            </form>

                            <p className="homeojob-mobile__stores-label">
                                Get the link to download the app
                            </p>

                            <div className="homeojob-mobile__stores">
                                <a
                                    href="https://play.google.com/store"
                                    className="homeojob-mobile__store"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="ri-google-play-fill" aria-hidden="true" />
                                    <span>
                                        <small>GET IT ON</small>
                                        Google Play
                                    </span>
                                </a>
                                <a
                                    href="https://www.apple.com/app-store/"
                                    className="homeojob-mobile__store"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="ri-apple-fill" aria-hidden="true" />
                                    <span>
                                        <small>Download on the</small>
                                        App Store
                                    </span>
                                </a>
                            </div>

                            <div className="homeojob-mobile__features">
                                {FEATURES.map((item) => (
                                    <div
                                        key={item.label}
                                        className={`homeojob-mobile__feature homeojob-mobile__feature--${item.theme}`}
                                    >
                                        <span className="homeojob-mobile__feature-icon">
                                            <i className={item.icon} aria-hidden="true" />
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default MobileApp;
