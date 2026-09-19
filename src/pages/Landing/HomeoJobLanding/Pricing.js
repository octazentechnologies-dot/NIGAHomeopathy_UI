import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Spinner } from "reactstrap";
import { getPackages } from "../Minimaltheme/helpers/marketingApi";

const PLAN_META = [
    {
        theme: "blue",
        icon: "ri-calendar-schedule-line",
        popular: false,
        features: ["All core modules", "Perfect for trial", "No long commitment"],
        fallbackName: "9 Days",
        fallbackPrice: "₹1",
        fallbackDesc: "Full access to Homeocentrum modules.",
    },
    {
        theme: "green",
        icon: "ri-calendar-check-line",
        popular: true,
        features: ["All core modules", "Ideal for regular practice", "Full feature access"],
        fallbackName: "1 Month",
        fallbackPrice: "₹399",
        fallbackDesc: "Full access to Homeocentrum modules.",
    },
    {
        theme: "purple",
        icon: "ri-calendar-2-line",
        popular: false,
        features: ["All core modules", "Better value", "Uninterrupted practice"],
        fallbackName: "3 Months",
        fallbackPrice: "₹1,099",
        fallbackDesc: "Full access to Homeocentrum modules.",
    },
    {
        theme: "orange",
        icon: "ri-vip-crown-line",
        popular: false,
        features: ["All core modules", "Best value for long term", "Focus on your growth"],
        fallbackName: "6 Months",
        fallbackPrice: "₹2,999",
        fallbackDesc: "Full access to Homeocentrum modules.",
    },
];

const TRUST_ITEMS = [
    {
        icon: "ri-infinity-fill",
        tone: "blue",
        title: "Full Access",
        text: "To all modules",
    },
    {
        icon: "ri-shield-check-fill",
        tone: "green",
        title: "Safe & Secure",
        text: "Your data is protected",
    },
    {
        icon: "ri-cloud-fill",
        tone: "purple",
        title: "Cloud Based",
        text: "Access anytime, anywhere",
    },
    {
        icon: "ri-customer-service-2-fill",
        tone: "orange",
        title: "Support",
        text: "We're here to help",
    },
];

const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string" && (value.includes("₹") || value.toLowerCase().includes("contact"))) {
        return value;
    }
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return `₹${num.toLocaleString("en-IN")}`;
};

const Pricing = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPackages()
            .then((list) => setPackages(Array.isArray(list) ? list.slice(0, 4) : []))
            .catch(() => setPackages([]))
            .finally(() => setLoading(false));
    }, []);

    const plans = useMemo(
        () =>
            PLAN_META.map((meta, index) => {
                const pkg = packages[index];
                return {
                    ...meta,
                    id: pkg?.packageId || meta.fallbackName,
                    name: pkg?.packageName || pkg?.packageTitle || meta.fallbackName,
                    price:
                        formatPrice(pkg?.packageAmount ?? pkg?.amount) || meta.fallbackPrice,
                    description:
                        pkg?.packageDescription ||
                        pkg?.description ||
                        meta.fallbackDesc,
                };
            }),
        [packages]
    );

    return (
        <section className="section homeojob-pricing" id="findJob">
            <div className="homeojob-pricing__dots" aria-hidden="true" />

            <Container className="position-relative">
                <div className="homeojob-pricing__header">
                    <p className="homeojob-pricing__eyebrow">Simple &amp; Flexible Pricing</p>
                    <h2 className="homeojob-pricing__title">
                        Find Your <span className="text-primary">Plan</span> You Deserve It
                    </h2>
                    <p className="homeojob-pricing__subtitle">
                        Flexible pricing for individual practitioners and clinics. Choose the plan
                        that fits your practice.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                    </div>
                ) : (
                    <>
                        <Row className="g-3 g-xl-4 homeojob-pricing__grid">
                            {plans.map((plan) => (
                                <Col lg={6} key={plan.id} className="d-flex">
                                    <article
                                        className={`homeojob-plan-card homeojob-plan-card--${plan.theme}${
                                            plan.popular ? " homeojob-plan-card--popular" : ""
                                        }`}
                                    >
                                        {plan.popular ? (
                                            <span className="homeojob-plan-card__badge">
                                                <i className="ri-star-fill" aria-hidden="true" />
                                                Most Popular
                                            </span>
                                        ) : null}

                                        <div className="homeojob-plan-card__main">
                                            <div className="homeojob-plan-card__intro">
                                                <span
                                                    className="homeojob-plan-card__icon"
                                                    aria-hidden="true"
                                                >
                                                    <i className={plan.icon} />
                                                </span>
                                                <div>
                                                    <h3 className="homeojob-plan-card__name">
                                                        {plan.name}
                                                    </h3>
                                                    <p className="homeojob-plan-card__price">
                                                        {plan.price}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="homeojob-plan-card__desc">{plan.description}</p>

                                            <div className="homeojob-plan-card__tags">
                                                <span className="homeojob-plan-card__tag homeojob-plan-card__tag--green">
                                                    <i className="ri-cloud-line" aria-hidden="true" />
                                                    Cloud Based
                                                </span>
                                                <span className="homeojob-plan-card__tag homeojob-plan-card__tag--blue">
                                                    <i className="ri-shield-check-line" aria-hidden="true" />
                                                    Secure
                                                </span>
                                            </div>
                                        </div>

                                        <div className="homeojob-plan-card__side">
                                            <ul className="homeojob-plan-card__features">
                                                {plan.features.map((feature) => (
                                                    <li key={feature}>
                                                        <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Link
                                                to="/register"
                                                className={`homeojob-plan-card__cta${
                                                    plan.popular ? " homeojob-plan-card__cta--solid" : ""
                                                }`}
                                            >
                                                Get Started
                                                <i className="ri-arrow-right-line" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                </Col>
                            ))}
                        </Row>

                        <div className="homeojob-pricing__trust">
                            {TRUST_ITEMS.map((item) => (
                                <div className="homeojob-pricing__trust-item" key={item.title}>
                                    <span
                                        className={`homeojob-pricing__trust-icon homeojob-pricing__trust-icon--${item.tone}`}
                                        aria-hidden="true"
                                    >
                                        <i className={item.icon} />
                                    </span>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <span>{item.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Container>
        </section>
    );
};

export default Pricing;
