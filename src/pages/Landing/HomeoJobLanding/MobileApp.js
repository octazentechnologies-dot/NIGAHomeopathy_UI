import React, { useState } from "react";
import { Col, Container, Row } from "reactstrap";
import PhoneVisual from "../../../assets/images/landing/mobile-app-phone.png";
import { SITE, APP_STORE_LINKS } from "../Minimaltheme/constants/siteContent";
import { submitEnquiry } from "../Minimaltheme/helpers/marketingApi";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

const FEATURES = [
    {
        icon: "ri-vidicon-fill",
        label: "Video Consultation with Top Doctors",
        theme: "blue",
    },
    {
        icon: "ri-calendar-check-fill",
        label: "Book a Slot Online",
        theme: "green",
    },
    {
        icon: "ri-shield-check-fill",
        label: "Secure & Reliable",
        theme: "purple",
    },
];

const StoreBadge = ({ icon, caption, label, url }) => {
    const inner = (
        <>
            <i className={icon} aria-hidden="true" />
            <span>
                <small>{url ? caption : "Coming soon on"}</small>
                {label}
            </span>
        </>
    );

    if (url) {
        return (
            <a href={url} className="homeojob-mobile__store" target="_blank" rel="noopener noreferrer">
                {inner}
            </a>
        );
    }

    return (
        <span className="homeojob-mobile__store" aria-disabled="true">
            {inner}
        </span>
    );
};

const MobileApp = () => {
    const [phone, setPhone] = useState("");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSendSms = async (event) => {
        event.preventDefault();
        const mobile = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
        if (!INDIAN_MOBILE.test(mobile)) {
            setStatus({ ok: false, text: "Enter a valid 10-digit Indian mobile number." });
            return;
        }
        setSending(true);
        setStatus(null);
        try {
            await submitEnquiry({
                enquiryName: "Mobile app link request",
                mobileNo: mobile,
                enquiryDetails: "Asked for the mobile app download link by SMS from the website Mobile App section.",
            });
            setPhone("");
            setStatus({ ok: true, text: "Thanks. We will text you the download link as soon as the app is live." });
        } catch {
            setStatus({ ok: false, text: "Could not save your request. Please try again." });
        } finally {
            setSending(false);
        }
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
                                on the {SITE.name} app. Connect with doctors online and book a slot
                                that suits you, from the comfort of your home.
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
                                <button type="submit" className="homeojob-mobile__sms-btn" disabled={sending}>
                                    {sending ? "Sending..." : "Send SMS"}
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </button>
                            </form>
                            {status && (
                                <p
                                    className={`small mb-3 ${status.ok ? "text-success" : "text-danger"}`}
                                    role={status.ok ? "status" : "alert"}
                                >
                                    {status.text}
                                </p>
                            )}

                            <p className="homeojob-mobile__stores-label">
                                Get the link to download the app
                            </p>

                            <div className="homeojob-mobile__stores">
                                {APP_STORE_LINKS.map((store) => (
                                    <StoreBadge key={store.id} {...store} />
                                ))}
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
