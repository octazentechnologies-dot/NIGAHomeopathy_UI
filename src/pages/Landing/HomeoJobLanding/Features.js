import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Container, Row } from "reactstrap";

import Avatar10 from "../../../assets/images/users/avatar-10.jpg";
import About from "../../../assets/images/about.jpg";
import { ABOUT_CONTENT, TESTIMONIALS, WHY_CHOOSE } from "../Minimaltheme/constants/siteContent";

const Features = () => (
    <section className="section">
        <Container>
            <Row className="align-items-center justify-content-lg-between justify-content-center gy-4">
                <Col lg={5} sm={7}>
                    <div className="about-img-section mb-5 mb-lg-0 text-center">
                        <Card className="card-bg-fill rounded shadow-lg inquiry-box d-none d-lg-block">
                            <CardBody className="d-flex align-items-center">
                                <div className="avatar-sm flex-shrink-0 me-3">
                                    <div className="avatar-title bg-secondary-subtle text-secondary rounded-circle fs-18">
                                        <i className="ri-briefcase-2-line"></i>
                                    </div>
                                </div>
                                <h5 className="fs-15 lh-base mb-0">
                                    Trusted by{" "}
                                    <span className="text-secondary fw-semibold">100+</span> practitioners
                                </h5>
                            </CardBody>
                        </Card>

                        <Card className="feedback-box card-bg-fill">
                            <CardBody className="d-flex shadow-lg">
                                <div className="flex-shrink-0 me-3">
                                    <img src={Avatar10} alt="" className="avatar-sm rounded-circle" />
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-14 lh-base mb-0">{TESTIMONIALS[0]?.name}</h5>
                                    <p className="text-muted fs-11 mb-1">{TESTIMONIALS[0]?.location}</p>
                                    <div className="text-warning">
                                        <i className="ri-star-s-fill me-1"></i>
                                        <i className="ri-star-s-fill me-1"></i>
                                        <i className="ri-star-s-fill me-1"></i>
                                        <i className="ri-star-s-fill me-1"></i>
                                        <i className="ri-star-s-line"></i>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                        <img src={About} alt="" className="img-fluid mx-auto rounded-3" />
                    </div>
                </Col>
                <Col lg={6}>
                    <div className="text-muted">
                        <h1 className="mb-3 lh-base">
                            Find your <span className="text-primary">Homeo Centrum</span> practice platform in one place
                        </h1>
                        <p className="ff-secondary fs-16 mb-2">{WHY_CHOOSE.description}</p>
                        <p className="ff-secondary fs-16">{ABOUT_CONTENT.quote}</p>

                        <div className="vstack gap-2 mb-4 pb-1">
                            {WHY_CHOOSE.items.map((item) => (
                                <div className="d-flex align-items-center" key={item.title}>
                                    <div className="flex-shrink-0 me-2">
                                        <div className="avatar-xs icon-effect">
                                            <div className="avatar-title bg-transparent text-success rounded-circle h2">
                                                <i className="ri-check-fill"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="mb-0">{item.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/register" className="btn btn-primary">
                            Get Started <i className="ri-arrow-right-line align-bottom ms-1"></i>
                        </Link>
                    </div>
                </Col>
            </Row>
        </Container>
    </section>
);

export default Features;
