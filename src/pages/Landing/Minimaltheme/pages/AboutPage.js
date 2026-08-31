import React, { useEffect } from "react";
import { Col, Container, Row, Card, CardBody } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { ABOUT_CONTENT, SITE } from "../constants/siteContent";

const AboutPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | About Us`;
    }, []);

    return (
        <>
            <PageBanner title="About Us" breadcrumb="About Us" />
            <section className="section">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={7}>
                            <h4 className="text-success mb-3">{ABOUT_CONTENT.quote}</h4>
                            <p className="text-muted ff-secondary">{ABOUT_CONTENT.intro}</p>
                            <ul className="list-unstyled vstack gap-3 mt-4">
                                {ABOUT_CONTENT.bullets.map((b) => (
                                    <li key={b} className="d-flex">
                                        <i className="ri-checkbox-circle-fill text-success me-2 mt-1 flex-shrink-0"></i>
                                        <span className="text-muted ff-secondary">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </Col>
                        <Col lg={5}>
                            <Card className="border-0 bg-light">
                                <CardBody className="p-4 text-center">
                                    <div className="avatar-lg mx-auto mb-3">
                                        <div className="avatar-title bg-success-subtle text-success rounded-circle fs-1">
                                            <i className="ri-heart-pulse-line"></i>
                                        </div>
                                    </div>
                                    <p className="fw-semibold text-success mb-0">{ABOUT_CONTENT.footerNote}</p>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default AboutPage;
