import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Card, Col, Container, Form, Input, Row, UncontrolledTooltip } from "reactstrap";

import Avatar3 from "../../../assets/images/users/avatar-3.jpg";
import Avatar9 from "../../../assets/images/users/avatar-9.jpg";
import Avatar10 from "../../../assets/images/users/avatar-10.jpg";
import JobProfile2 from "../../../assets/images/job-profile2.png";
import { HERO, SITE } from "../Minimaltheme/constants/siteContent";
import { HERO_KEYWORDS } from "./constants/jobLandingContent";

const Home = () => {
    const navigate = useNavigate();

    return (
        <section className="section job-hero-section bg-light pb-0" id="hero">
            <Container>
                <Row className="justify-content-between align-items-center">
                    <Col lg={6} className="homeojob-hero-copy text-center text-lg-start">
                        <div>
                            <h1 className="display-6 fw-bold text-capitalize mb-3 lh-base">
                                {HERO.title}{" "}
                                <span className="text-primary">{HERO.highlight}</span>
                            </h1>
                            <p className="lead text-muted fw-normal lh-base mb-4">{HERO.subtitle}</p>
                            <Form action="#" className="job-panel-filter" onSubmit={(e) => e.preventDefault()}>
                                <Row className="g-md-0 g-2 justify-content-center justify-content-md-start">
                                    <Col xs={12} md={4}>
                                        <Input
                                            type="search"
                                            id="job-title"
                                            className="form-control filter-input-box"
                                            placeholder="Search modules, rubrics..."
                                        />
                                    </Col>
                                    <Col xs={12} md={4}>
                                        <select className="form-control" defaultValue="">
                                            <option value="">Select module</option>
                                            <option value="case">Case Taking</option>
                                            <option value="repertory">Repertorization</option>
                                            <option value="diagnosis">Diagnosis Master</option>
                                            <option value="materia">Materia Medica</option>
                                        </select>
                                    </Col>
                                    <Col xs={12} md={4}>
                                        <div className="h-100">
                                            <button
                                                className="btn btn-primary submit-btn w-100 h-100"
                                                type="button"
                                                onClick={() => navigate("/register")}
                                            >
                                                <i className="ri-search-2-line align-bottom me-1"></i>
                                                Get Started
                                            </button>
                                        </div>
                                    </Col>
                                </Row>
                            </Form>

                            <ul className="treding-keywords list-inline mb-0 mt-3 fs-13">
                                <li className="list-inline-item text-primary fw-semibold">
                                    <i className="mdi mdi-tag-multiple-outline align-middle"></i> Popular Modules:
                                </li>
                                {HERO_KEYWORDS.map((keyword, idx) => (
                                    <li className="list-inline-item" key={keyword}>
                                        <Link to="/register">
                                            {keyword}
                                            {idx < HERO_KEYWORDS.length - 1 ? "," : ""}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Col>
                    <Col lg={4}>
                        <div className="position-relative home-img text-center mt-5 mt-lg-0">
                            <Card className="card-bg-fill p-3 rounded shadow-lg inquiry-box">
                                <div className="d-flex align-items-center">
                                    <div className="avatar-sm flex-shrink-0 me-3">
                                        <div className="avatar-title bg-warning-subtle text-warning rounded fs-18">
                                            <i className="ri-mail-send-line"></i>
                                        </div>
                                    </div>
                                    <h5 className="fs-15 lh-base mb-0">Work Inquiry from {SITE.name}</h5>
                                </div>
                            </Card>

                            <Card className="card-bg-fill p-3 rounded shadow-lg application-box">
                                <h5 className="fs-15 lh-base mb-3">Applications</h5>
                                <div className="avatar-group">
                                    <Link to="/register" className="avatar-group-item" id="brent">
                                        <UncontrolledTooltip placement="top" target="brent">
                                            Practitioner
                                        </UncontrolledTooltip>
                                        <div className="avatar-xs">
                                            <img src={Avatar3} alt="" className="rounded-circle img-fluid" />
                                        </div>
                                    </Link>
                                    <Link to="/register" className="avatar-group-item" id="ellen">
                                        <UncontrolledTooltip placement="top" target="ellen">
                                            Practitioner
                                        </UncontrolledTooltip>
                                        <div className="avatar-xs">
                                            <div className="avatar-title rounded-circle bg-danger">S</div>
                                        </div>
                                    </Link>
                                    <Link to="/register" className="avatar-group-item" id="smith">
                                        <UncontrolledTooltip placement="top" target="smith">
                                            Practitioner
                                        </UncontrolledTooltip>
                                        <div className="avatar-xs">
                                            <img src={Avatar10} alt="" className="rounded-circle img-fluid" />
                                        </div>
                                    </Link>
                                    <Link to="/register" className="avatar-group-item">
                                        <div className="avatar-xs">
                                            <div className="avatar-title rounded-circle bg-success">Z</div>
                                        </div>
                                    </Link>
                                    <Link to="/register" className="avatar-group-item" id="gonzalez">
                                        <UncontrolledTooltip placement="top" target="gonzalez">
                                            Practitioner
                                        </UncontrolledTooltip>
                                        <div className="avatar-xs">
                                            <img src={Avatar9} alt="" className="rounded-circle img-fluid" />
                                        </div>
                                    </Link>
                                    <Link to="/register" className="avatar-group-item" id="more">
                                        <UncontrolledTooltip placement="top" target="more">
                                            More Practitioners
                                        </UncontrolledTooltip>
                                        <div className="avatar-xs">
                                            <div className="avatar-title fs-13 rounded-circle bg-light border-dashed border text-primary">
                                                100+
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </Card>
                            <img src={JobProfile2} alt="" className="user-img" />
                            <div className="circle-effect">
                                <div className="circle"></div>
                                <div className="circle2"></div>
                                <div className="circle3"></div>
                                <div className="circle4"></div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default Home;
