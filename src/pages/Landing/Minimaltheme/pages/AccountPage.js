import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Card, CardBody } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { SITE } from "../constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";

const AccountPage = () => {
    useEffect(() => {
        document.title = `${SITE.name} | Account`;
    }, []);

    return (
        <>
            <PageBanner title="Account" breadcrumb="Account" />
            <section className="section">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={6} md={8}>
                            <Card className="shadow-sm border">
                                <CardBody className="p-4 p-md-5 text-center">
                                    <h4 className="mb-4">Welcome to {SITE.name}</h4>
                                    <p className="text-muted ff-secondary mb-4">
                                        Sign in to access your doctor dashboard, or register for a new subscription plan.
                                    </p>
                                    <div className="d-grid gap-3">
                                        <Link to="/login" className="btn btn-primary btn-lg">
                                            <i className="ri-user-line me-2"></i>Login
                                        </Link>
                                        <Link to="/register" className="btn btn-soft-success btn-lg">
                                            <i className="ri-pencil-line me-2"></i>Register
                                        </Link>
                                    </div>
                                    <p className="text-muted ff-secondary mt-4 mb-0 fs-13">
                                        New users can view <Link to={landingPath("pricing")}>pricing plans</Link> before registering.
                                    </p>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default AccountPage;
