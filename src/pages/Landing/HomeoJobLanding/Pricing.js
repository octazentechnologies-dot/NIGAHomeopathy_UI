import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";
import { getPackages } from "../Minimaltheme/helpers/marketingApi";

const Pricing = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPackages()
            .then((list) => setPackages(list.slice(0, 4)))
            .catch(() => setPackages([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="section" id="findJob">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={7}>
                        <div className="text-center mb-5">
                            <h1 className="mb-3 ff-secondary fw-semibold text-capitalize lh-base">
                                Find Your <span className="text-primary">Plan</span> You Deserve it
                            </h1>
                            <p className="text-muted">
                                Flexible pricing for individual practitioners and clinics. Choose the plan that fits your practice.
                            </p>
                        </div>
                    </Col>
                </Row>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                    </div>
                ) : (
                    <Row>
                        {(packages.length ? packages : [{ packageName: "Starter", packageAmount: "Contact us", packageDescription: "Get started with Homeo Centrum" }]).map((pkg, key) => (
                            <Col lg={6} key={pkg.packageId || key}>
                                <Card className="shadow-lg">
                                    <CardBody>
                                        <div className="d-flex">
                                            <div className="avatar-sm">
                                                <div className="avatar-title homeojob-plan-icon rounded">
                                                    <i className="ri-price-tag-3-line fs-20"></i>
                                                </div>
                                            </div>
                                            <div className="ms-3 flex-grow-1">
                                                <h5>{pkg.packageName || pkg.packageTitle || "Plan"}</h5>
                                                <ul className="list-inline text-muted mb-3">
                                                    <li className="list-inline-item">
                                                        <i className="ri-money-dollar-circle-line align-bottom me-1"></i>
                                                        {pkg.packageAmount ?? pkg.amount ?? "Contact us"}
                                                    </li>
                                                </ul>
                                                <p className="text-muted mb-3">
                                                    {pkg.packageDescription || pkg.description || "Full access to Homeo Centrum modules."}
                                                </p>
                                                <div className="hstack gap-2">
                                                    <span className="badge bg-success-subtle text-success">Cloud Based</span>
                                                    <span className="badge bg-info-subtle text-info">Secure</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Link to="/register" className="btn btn-ghost-primary btn-icon">
                                                    <i className="ri-arrow-right-line"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                        <Col lg={12}>
                            <div className="text-center mt-4">
                                <Link to="/register" className="btn btn-ghost-info">
                                    View All Plans <i className="ri-arrow-right-line align-bottom"></i>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                )}
            </Container>
        </section>
    );
};

export default Pricing;
