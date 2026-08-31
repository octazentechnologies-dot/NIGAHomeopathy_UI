import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { MODULE_CATEGORIES } from "./constants/jobLandingContent";

const Categories = () => (
    <>
        <section className="section bg-light" id="categories">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={7}>
                        <div className="text-center mb-5">
                            <h1 className="mb-3 ff-secondary fw-semibold text-capitalize lh-base">
                                Cloud homeopathy{" "}
                                <span className="text-primary">modules</span> featured
                            </h1>
                            <p className="text-muted">
                                Case taking, repertorization, diagnosis master, materia medica, and deep analytics in one platform.
                            </p>
                        </div>
                    </Col>
                </Row>

                <Row className="justify-content-center">
                    {MODULE_CATEGORIES.map((item) => (
                        <Col lg={3} md={6} key={item.label}>
                            <Card className="shadow-none text-center py-3">
                                <CardBody className="py-4">
                                    <div className="avatar-sm position-relative mb-4 mx-auto">
                                        <div className="job-icon-effect"></div>
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className={item.icon}></i>
                                        </div>
                                    </div>
                                    <h5 className="fs-17 pt-1">{item.label}</h5>
                                    <p className="mb-0 text-muted">{item.detail}</p>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
        <section className="py-5 bg-primary position-relative">
            <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
            <Container>
                <Row className="align-items-center gy-4">
                    <Col sm>
                        <h4 className="text-white mb-2">Ready to Started?</h4>
                        <p className="text-white-50 mb-0">Create new account and start your Homeo Centrum practice</p>
                    </Col>
                    <Col sm="auto">
                        <Link to="/register" className="btn bg-gradient btn-danger">
                            Create Free Account
                        </Link>
                    </Col>
                </Row>
            </Container>
        </section>
    </>
);

export default Categories;
