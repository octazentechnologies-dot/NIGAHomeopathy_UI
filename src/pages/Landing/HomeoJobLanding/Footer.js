import React from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import LogoLight from "../../../assets/images/logo-light.png";
import { SITE, FOOTER_SERVICES, ABOUT_CONTENT, SOCIAL_LINKS } from "../Minimaltheme/constants/siteContent";
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
                    <Link to={landingPath()} className="homeojob-footer-brand">
                        <img src={LogoLight} className="card-logo card-logo-light" alt={SITE.name} />
                    </Link>
                    <div className="mt-4 fs-15">
                        <p className="text-white fw-semibold">{SITE.name}</p>
                        <p>{ABOUT_CONTENT.aboutHome.text}</p>
                        <Link to={landingPath("about")} className="text-success">
                            More About us <i className="ri-arrow-right-line"></i>
                        </Link>
                    </div>
                </Col>
                <Col lg={7} className="ms-lg-auto">
                    <Row>
                        <Col sm={4} className="mt-4">
                            <h5 className="text-white mb-0">Our Modules</h5>
                            <ul className="list-unstyled ff-secondary footer-list text-muted mt-3">
                                {FOOTER_SERVICES.map((s) => (
                                    <li key={s}><Link to={landingPath("features")}>{s}</Link></li>
                                ))}
                            </ul>
                        </Col>
                        <Col sm={4} className="mt-4">
                            <h5 className="text-white mb-0">Quick Links</h5>
                            <ul className="list-unstyled ff-secondary footer-list text-muted mt-3">
                                <li><Link to={landingPath("pricing")}>Pricing</Link></li>
                                <li><Link to={landingPath("blog")}>Blog</Link></li>
                                <li><Link to={landingPath("news")}>News</Link></li>
                                <li><Link to={landingPath("contact")}>Contact</Link></li>
                                <li><Link to={landingPath("account")}>Account</Link></li>
                            </ul>
                        </Col>
                        <Col sm={4} className="mt-4">
                            <h5 className="text-white mb-0">Support</h5>
                            <ul className="list-unstyled ff-secondary footer-list text-muted mt-3">
                                <li><Link to={landingPath("privacy")}>Privacy Policy</Link></li>
                                <li><Link to={landingPath("terms")}>Terms & Conditions</Link></li>
                                <li><Link to={landingPath("contact")}>Contact Us</Link></li>
                            </ul>
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
                    <ul className="list-inline mb-0 footer-social-link text-sm-end mt-3 mt-sm-0">
                        {SOCIAL_LINKS.map((social) => (
                            <li className="list-inline-item" key={social.id}>
                                <SocialIcon icon={social.icon} label={social.label} url={social.url} />
                            </li>
                        ))}
                    </ul>
                </Col>
            </Row>
        </Container>
    </footer>
);

export default Footer;
