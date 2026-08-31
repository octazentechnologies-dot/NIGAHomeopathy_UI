import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Card, CardBody, Spinner } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { SITE } from "../constants/siteContent";
import { getPackages } from "../helpers/marketingApi";

const PricingPage = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = `${SITE.name} | Pricing`;
        getPackages()
            .then((list) => setPackages(list))
            .catch(() => setError("Unable to load pricing plans. Please try again later."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <PageBanner title="Pricing Plans" breadcrumb="Pricing" />
            <section className="section bg-light" id="plans">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Choose the plan that&apos;s right for you</h3>
                                <p className="text-muted mb-4 ff-secondary">
                                    Subscription packages for homeopathic practitioners. All modules included. Prices in INR (₹).
                                </p>
                            </div>
                        </Col>
                    </Row>
                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : error ? (
                        <div className="text-center text-danger py-5">{error}</div>
                    ) : (
                        <Row className="gy-4 justify-content-center">
                            {packages.map((pkg) => (
                                <Col lg={4} md={6} key={pkg.packageName}>
                                    <Card className="plan-box mb-0 h-100">
                                        <CardBody className="p-4 m-2">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1 fw-semibold">{pkg.packageName}</h5>
                                                    <p className="text-muted mb-0">All modules included</p>
                                                </div>
                                                <div className="avatar-sm">
                                                    <div className="avatar-title bg-light rounded-circle text-primary">
                                                        <i className="ri-book-mark-line fs-20"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-4 text-center">
                                                <h1 className="mb-0">
                                                    <sup><small>₹</small></sup>
                                                    <span className="ff-secondary fw-bold">{pkg.amount}</span>
                                                </h1>
                                            </div>
                                            <ul className="list-unstyled text-muted vstack gap-3 ff-secondary">
                                                <li>
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0 text-success me-1"><i className="ri-checkbox-circle-fill fs-15 align-middle"></i></div>
                                                        <div className="flex-grow-1">Validity <b>{pkg.validityInDays}</b> Days</div>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0 text-success me-1"><i className="ri-checkbox-circle-fill fs-15 align-middle"></i></div>
                                                        <div className="flex-grow-1"><b>Unlimited</b> Cases</div>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0 text-success me-1"><i className="ri-checkbox-circle-fill fs-15 align-middle"></i></div>
                                                        <div className="flex-grow-1"><b>Single</b> Login</div>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0 text-success me-1"><i className="ri-checkbox-circle-fill fs-15 align-middle"></i></div>
                                                        <div className="flex-grow-1"><b>All</b> Clinical Modules</div>
                                                    </div>
                                                </li>
                                            </ul>
                                            <div className="mt-4">
                                                <Link to="/login" className="btn btn-soft-success w-100">
                                                    Buy Now
                                                </Link>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Container>
            </section>
        </>
    );
};

export default PricingPage;
