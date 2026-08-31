import React, { useEffect } from "react";
import { Col, Container, Row } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { PRIVACY_SECTIONS } from "../constants/privacyContent";
import { SITE } from "../constants/siteContent";

const PrivacyPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | Privacy & Policy`;
    }, []);

    return (
        <>
            <PageBanner title="Privacy & Policy" breadcrumb="Privacy & Policy" />
            <section className="section">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={10}>
                            {PRIVACY_SECTIONS.map((section, idx) => (
                                <div key={idx} className="mb-4">
                                    {section.intro && (
                                        <div className="text-muted ff-secondary" dangerouslySetInnerHTML={{ __html: section.html }} />
                                    )}
                                    {section.title && <h4 className="mb-3">{section.title}</h4>}
                                    {section.html && !section.intro && (
                                        <div className="text-muted ff-secondary" dangerouslySetInnerHTML={{ __html: section.html }} />
                                    )}
                                    {section.list && (
                                        <ul className="list-unstyled vstack gap-2 mt-3">
                                            {section.list.map((item) => (
                                                <li key={item} className="d-flex text-muted ff-secondary">
                                                    <i className="ri-checkbox-blank-circle-fill text-success me-2 mt-1 fs-10"></i>{item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.after && (
                                        <div className="text-muted ff-secondary mt-3" dangerouslySetInnerHTML={{ __html: section.after }} />
                                    )}
                                    {!section.intro && <hr className="my-4" />}
                                </div>
                            ))}
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default PrivacyPage;
