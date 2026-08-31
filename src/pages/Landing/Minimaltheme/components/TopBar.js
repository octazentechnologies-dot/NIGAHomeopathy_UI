import React from "react";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { SITE } from "../constants/siteContent";

const TopBar = () => (
    <div className="bg-primary py-2 d-none d-lg-block">
        <Container>
            <Row className="align-items-center">
                <Col lg={7}>
                    <div className="d-flex flex-wrap gap-4 text-white-50 fs-13">
                        <span><i className="ri-phone-line me-1 text-white"></i>Phone: {SITE.phone}</span>
                        <span><i className="ri-mail-line me-1 text-white"></i>{SITE.email}</span>
                    </div>
                </Col>
                <Col lg={5} className="text-lg-end">
                    <div className="d-flex align-items-center justify-content-lg-end gap-2">
                        <div className="d-flex gap-2 me-3">
                            {["facebook", "twitter", "linkedin", "instagram", "google", "youtube"].map((s) => (
                                <Link key={s} to="#" className="avatar-xs d-inline-block">
                                    <span className="avatar-title rounded-circle bg-white bg-opacity-10 text-white fs-12">
                                        <i className={`ri-${s === "google" ? "google-fill" : s === "youtube" ? "youtube-fill" : s + "-fill"}`}></i>
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <Link to="/register" className="btn btn-sm btn-soft-light">
                            <i className="ri-pencil-line me-1"></i>Register
                        </Link>
                        <Link to="/login" className="btn btn-sm btn-light">
                            <i className="ri-user-line me-1"></i>Login
                        </Link>
                    </div>
                </Col>
            </Row>
        </Container>
    </div>
);

export default TopBar;
