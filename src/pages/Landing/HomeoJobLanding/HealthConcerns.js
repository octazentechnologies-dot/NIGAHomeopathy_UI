import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { landingPath } from "../../../constants/landingRoutes";

import IconCold from "../../../assets/images/landing/health-concerns/cold.png";
import IconAcne from "../../../assets/images/landing/health-concerns/acne.png";
import IconAllergy from "../../../assets/images/landing/health-concerns/allergy.png";
import IconDigestive from "../../../assets/images/landing/health-concerns/digestive.png";
import IconJoint from "../../../assets/images/landing/health-concerns/joint.png";
import IconMigraine from "../../../assets/images/landing/health-concerns/migraine.png";
import IconWomen from "../../../assets/images/landing/health-concerns/women.png";
import IconChild from "../../../assets/images/landing/health-concerns/child.png";
import IconThyroid from "../../../assets/images/landing/health-concerns/thyroid.png";
import IconRespiratory from "../../../assets/images/landing/health-concerns/respiratory.png";
import IconStress from "../../../assets/images/landing/health-concerns/stress.png";
import IconHair from "../../../assets/images/landing/health-concerns/hair.png";

const HEALTH_CONCERNS = [
    { id: "cold", title: "Cold, Cough & Fever", icon: IconCold },
    { id: "acne", title: "Acne & Skin Problems", icon: IconAcne },
    { id: "allergy", title: "Allergy & Sinus", icon: IconAllergy },
    { id: "digestive", title: "Digestive Problems", icon: IconDigestive },
    { id: "joint", title: "Joint & Muscle Pain", icon: IconJoint },
    { id: "migraine", title: "Migraine & Headache", icon: IconMigraine },
    { id: "women", title: "Women's Health", icon: IconWomen },
    { id: "child", title: "Child Health", icon: IconChild },
    { id: "thyroid", title: "Thyroid & Hormonal Issues", icon: IconThyroid },
    { id: "respiratory", title: "Respiratory Problems", icon: IconRespiratory },
    { id: "stress", title: "Stress, Anxiety & Sleep", icon: IconStress },
    { id: "hair", title: "Hair Fall & Scalp Problems", icon: IconHair },
];

const HealthConcerns = () => (
    <section className="section homeojob-health-concerns" id="health-concerns">
        <Container>
            <div className="homeojob-health-concerns__header">
                <div className="homeojob-health-concerns__intro">
                    <p className="homeojob-health-concerns__eyebrow">Common Health Concerns</p>
                    <h2 className="homeojob-health-concerns__title">
                        Consult top homeopathy doctors for your health concerns
                    </h2>
                    <p className="homeojob-health-concerns__subtitle">
                        Gentle, natural and personalized care for you and your family.
                    </p>
                </div>
                <Link to={landingPath("features")} className="homeojob-health-concerns__view-all">
                    View All Health Concerns <i className="ri-arrow-right-line" aria-hidden="true" />
                </Link>
            </div>

            <Row className="g-4 g-xl-4 homeojob-health-concerns__grid">
                {HEALTH_CONCERNS.map((item) => (
                    <Col xl={2} lg={3} md={4} sm={6} xs={6} key={item.id}>
                        <Link
                            to={`${landingPath("find-doctor")}?concern=${encodeURIComponent(item.title)}`}
                            className="homeojob-health-concern"
                        >
                            <span className="homeojob-health-concern__icon-wrap">
                                <img src={item.icon} alt="" className="homeojob-health-concern__icon" />
                            </span>
                            <span className="homeojob-health-concern__title">{item.title}</span>
                            <span className="homeojob-health-concern__cta">
                                Consult Now <i className="ri-arrow-right-s-line" aria-hidden="true" />
                            </span>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    </section>
);

export default HealthConcerns;
