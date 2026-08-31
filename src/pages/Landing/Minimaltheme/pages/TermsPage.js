import React, { useEffect } from "react";
import { Col, Container, Row } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { TERMS_INTRO, TERMS_SECTIONS } from "../constants/termsContent";
import { SITE } from "../constants/siteContent";

const TermsPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | Terms & Conditions`;
    }, []);

    return (
        <>
            <PageBanner title="Terms & Conditions" breadcrumb="Terms & Conditions" />
            <section className="section">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={10}>
                            <div className="text-muted ff-secondary" dangerouslySetInnerHTML={{ __html: TERMS_INTRO.html }} />
                            <ul className="list-unstyled vstack gap-2 my-3">
                                {TERMS_INTRO.list.map((item) => (
                                    <li key={item} className="d-flex text-muted ff-secondary">
                                        <i className="ri-checkbox-blank-circle-fill text-success me-2 mt-1 fs-10"></i>{item}
                                    </li>
                                ))}
                            </ul>
                            <div className="text-muted ff-secondary mb-4" dangerouslySetInnerHTML={{ __html: TERMS_INTRO.after }} />
                            <hr />
                            {TERMS_SECTIONS.map((section) => (
                                <div key={section.title} className="mb-4">
                                    <h4 className="mb-3">{section.title}</h4>
                                    <div className="text-muted ff-secondary" dangerouslySetInnerHTML={{ __html: section.html }} />
                                    {section.list && (
                                        <ul className="list-unstyled vstack gap-2 mt-3">
                                            {section.list.map((item) => (
                                                <li key={item} className="d-flex text-muted ff-secondary">
                                                    <i className="ri-checkbox-blank-circle-fill text-success me-2 mt-1 fs-10"></i>{item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <hr className="my-4" />
                                </div>
                            ))}
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default TermsPage;
