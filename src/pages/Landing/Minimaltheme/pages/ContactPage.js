import React, { useEffect, useState } from "react";
import { Col, Container, Row, Card, CardBody } from "reactstrap";
import PageBanner from "../components/PageBanner";
import ContactForm from "../components/ContactForm";
import { SITE } from "../constants/siteContent";
import { getPublicAppConfig, unwrapClinic } from "../../../../helpers/doctorClinicApi";

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

    const quickContact = [
        `Phone: ${support.phone}`,
        `Support: ${support.email}`,
        SITE.emailAlt ? SITE.emailAlt : null,
        support.whatsApp ? `WhatsApp: ${support.whatsApp}` : null,
    ]
        .filter(Boolean)
        .join("\n");

    return (
        <>
            <PageBanner title="Contact Us" breadcrumb="Contact" />
            <section className="section pb-0">
                <Container>
                    <Row className="g-4 mb-5">
                        {[
                            { icon: "ri-map-pin-line", title: "Visit Our Place", text: SITE.address },
                            { icon: "ri-time-line", title: "Office Schedule", text: `Days : Monday to Saturday\nTime : 09.00 AM to 06.00 PM\nSunday : Closed` },
                            { icon: "ri-phone-line", title: "Quick Contact", text: quickContact },
                        ].map((item) => (
                            <Col lg={4} md={6} key={item.title}>
                                <Card className="h-100 border-0 shadow-sm text-center">
                                    <CardBody className="p-4">
                                        <div className="avatar-sm icon-effect mx-auto mb-3">
                                            <div className="avatar-title bg-transparent text-success rounded-circle h1 mb-0">
                                                <i className={`${item.icon} fs-24`}></i>
                                            </div>
                                        </div>
                                        <h5>{item.title}</h5>
                                        <p className="text-muted ff-secondary mb-0" style={{ whiteSpace: "pre-line" }}>{item.text}</p>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
            <section className="section pt-0">
                <Container>
                    <Row className="gy-4">
                        <Col lg={6}>
                            <ContactForm showTitle title="Send Your Message Us" />
                        </Col>
                        <Col lg={6}>
                            <div className="rounded overflow-hidden" style={{ border: "1px solid #48c7ec" }}>
                                <iframe
                                    src={SITE.mapEmbed}
                                    width="100%"
                                    height="450"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Homeocentrum Location"
                                ></iframe>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default ContactPage;
