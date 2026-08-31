import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import logodark from "../../../assets/images/logo-dark.png";
import { SITE, FOOTER_SERVICES, ABOUT_CONTENT, SOCIAL_LINKS } from "./constants/siteContent";
import { landingPath } from "../../../constants/landingRoutes";

const SocialIcon = ({ icon, label, url }) => {
    const content = (
        <div className="avatar-title rounded-circle">
            <i className={icon}></i>
        </div>
    );

    if (url) {
        return (
            <a href={url} className="avatar-xs d-block" target="_blank" rel="noopener noreferrer" aria-label={label}>
                {content}
            </a>
        );
    }

    return (
        <span className="avatar-xs d-block footer-social-icon-static" aria-label={label} title={`${label} (link coming soon)`}>
            {content}
        </span>
    );
};

const Footer = () => (
    <footer className="custom-footer bg-dark py-5 position-relative">
        <Container>
            <Row>
                <Col lg={4} className="mt-4">
                    <Link to={landingPath()} className="minimaltheme-brand minimaltheme-footer-brand">
                        <img src={logodark} className="card-logo card-logo-dark" alt={SITE.name} />
                    </Link>
                    <div className="mt-4 fs-13">
                        <p className="text-white fw-semibold">{SITE.name}</p>
                        <p className="ff-secondary">{ABOUT_CONTENT.aboutHome.text}</p>
                        <Link to={landingPath("about")} className="text-success">
                            More About us <i className="ri-arrow-right-line"></i>
                        </Link>
                    </div>
                </Col>
                <Col lg={7} className="ms-lg-auto">
                    <Row>
                        <Col sm={4} className="mt-4">
                            <h5 className="text-white mb-0">Our Services</h5>
                            <div className="text-muted mt-3">
                                <ul className="list-unstyled ff-secondary footer-list">
                                    {FOOTER_SERVICES.map((s) => (
                                        <li key={s}><Link to={landingPath("features")}>{s}</Link></li>
                                    ))}
                                </ul>
                            </div>
                        </Col>
                        <Col sm={4} className="mt-4">
                            <h5 className="text-white mb-0">Quick Links</h5>
                            <div className="text-muted mt-3">
                                <ul className="list-unstyled ff-secondary footer-list">
                                    <li><Link to={landingPath("pricing")}>Pricing</Link></li>
                                    <li><Link to={landingPath("blog")}>Blog</Link></li>
                                    <li><Link to={landingPath("news")}>News</Link></li>
                                    <li><Link to={landingPath("contact")}>Contact</Link></li>
                                    <li><Link to={landingPath("account")}>Account</Link></li>
                                </ul>
                            </div>
                        </Col>
                        <Col sm={4} className="mt-4">
                            <h5 className="text-white mb-0">Support</h5>
                            <div className="text-muted mt-3">
                                <ul className="list-unstyled ff-secondary footer-list">
                                    <li><Link to={landingPath("privacy")}>Privacy Policy</Link></li>
                                    <li><Link to={landingPath("terms")}>Terms & Conditions</Link></li>
                                    <li><Link to={landingPath("contact")}>Contact Us</Link></li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="text-center text-sm-start align-items-center mt-5">
                <Col sm={6}>
                    <p className="copy-rights mb-0">
                        {new Date().getFullYear()} © {SITE.copyright}. All Rights Reserved.
                    </p>
                </Col>
                <Col sm={6}>
                    <div className="text-sm-end mt-3 mt-sm-0">
                        <ul className="list-inline mb-0 footer-social-link">
                            {SOCIAL_LINKS.map((social) => (
                                <li className="list-inline-item" key={social.id}>
                                    <SocialIcon icon={social.icon} label={social.label} url={social.url} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </Col>
            </Row>
        </Container>
    </footer>
);

export default Footer;
