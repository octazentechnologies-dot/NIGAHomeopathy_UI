import React from "react";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { landingPath } from "../../../../constants/landingRoutes";

const PageBanner = ({ title, breadcrumb }) => (
    <section className="section pb-0 page-banner-section">
        <Container>
            <Row className="justify-content-center">
                <Col lg={8} className="text-center">
                    <h2 className="fw-semibold mb-3">{title}</h2>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb justify-content-center mb-0 ff-secondary">
                            <li className="breadcrumb-item">
                                <Link to={landingPath()}><i className="ri-home-4-line me-1"></i>Home</Link>
                            </li>
                            {breadcrumb && <li className="breadcrumb-item active">{breadcrumb}</li>}
                        </ol>
                    </nav>
                </Col>
            </Row>
        </Container>
    </section>
);

export default PageBanner;
