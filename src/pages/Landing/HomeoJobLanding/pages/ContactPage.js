import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "reactstrap";

import ContactForm from "../../Minimaltheme/components/ContactForm";
import { SITE } from "../../Minimaltheme/constants/siteContent";
import { getPublicAppConfig, unwrapClinic } from "../../../../helpers/doctorClinicApi";
import LandingPageHero from "../components/LandingPageHero";

const ContactPage = () => {
    const [support, setSupport] = useState({
        phone: SITE.phone,
        email: SITE.supportEmail || SITE.email,
        whatsApp: null,
    });

    useEffect(() => {
        document.title = `${SITE.name} | Contact Us`;
        let cancelled = false;
        getPublicAppConfig()
            .then((response) => {
                if (cancelled) return;
                const data = unwrapClinic(response) || {};
                setSupport({
                    phone: data.supportPhone || data.SupportPhone || SITE.phone,
                    email: data.supportEmail || data.SupportEmail || SITE.supportEmail || SITE.email,
                    whatsApp: data.supportWhatsApp || data.SupportWhatsApp || null,
                });
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const cards = [
        { icon: "ri-map-pin-line", tone: "blue", title: "Visit our place", text: SITE.address },
        { icon: "ri-time-line", tone: "green", title: "Office schedule", text: SITE.hours },
        {
            icon: "ri-phone-line",
            tone: "purple",
            title: "Quick contact",
            text: [support.phone, support.email, support.whatsApp ? `WhatsApp ${support.whatsApp}` : null]
                .filter(Boolean)
                .join("\n"),
        },
    ];

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    breadcrumb="Contact"
                    eyebrow="We are here to help"
                    title="Contact"
                    highlight="Us"
                    subtitle="Questions about booking, practitioner plans, or support. Send a message and the team will reply."
                />

                <Row className="g-3 mb-4">
                    {cards.map((item) => (
                        <Col lg={4} md={6} key={item.title}>
                            <article className="homeojob-page__contact-card">
                                <span className={`homeojob-page__feature-icon homeojob-page__feature-icon--${item.tone}`}>
                                    <i className={item.icon} aria-hidden="true" />
                                </span>
                                <h2>{item.title}</h2>
                                <p>{item.text}</p>
                            </article>
                        </Col>
                    ))}
                </Row>

                <Row className="g-4 align-items-stretch">
                    <Col lg={6}>
                        <ContactForm showTitle title="Send us a message" />
                    </Col>
                    <Col lg={6}>
                        <div className="homeojob-page__map">
                            <iframe
                                src={SITE.mapEmbed}
                                title="Homeocentrum location"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default ContactPage;
