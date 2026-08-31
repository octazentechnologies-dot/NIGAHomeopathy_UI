import React, { useEffect } from "react";
import { Col, Container, Row, Card, CardBody } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { FEATURE_MODULES, SITE } from "../constants/siteContent";

const FeaturesPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | Features`;
    }, []);

    return (
        <>
            <PageBanner title="Homeo Centrum Features" breadcrumb="Features" />
            <section className="section">
                <Container>
                    <Row className="g-4">
                        {FEATURE_MODULES.map((mod, idx) => (
                            <Col lg={12} key={mod.title}>
                                <Card className="border shadow-sm">
                                    <CardBody className="p-4">
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="minimaltheme-feature-index flex-shrink-0">
                                                <span className="minimaltheme-feature-index-value">{idx + 1}</span>
                                            </div>
                                            <div>
                                                <h4 className="mb-3">{mod.title}</h4>
                                                <p className="text-muted ff-secondary mb-0">{mod.text}</p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default FeaturesPage;
