import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import LogoLight from "../../../assets/images/logo-light.png";
import {
    SITE,
    FOOTER_SERVICES,
    ABOUT_CONTENT,
    SOCIAL_LINKS,
} from "../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../constants/landingRoutes";

const MODULE_LINKS = FOOTER_SERVICES.map((label) => ({
    label,
    to: landingPath("features"),
}));

const QUICK_LINKS = [
    { label: "Homeo Meds", to: `${landingPath()}#homeomeds` },
    { label: "Hello Homeo", to: `${landingPath()}#telemedicine` },
    { label: "Blog", to: landingPath("blog") },
    { label: "News", to: landingPath("news") },
    { label: "Contact", to: landingPath("contact") },
];

const SUPPORT_LINKS = [
    { label: "Account", to: landingPath("account") },
    { label: "Pricing", to: landingPath("pricing") },
    { label: "Contact Us", to: landingPath("contact") },
    { label: "Help Center", to: landingPath("help") },
    { label: "FAQs", to: landingPath("contact") },
];

const TRUST_ITEMS = [
    { icon: "ri-leaf-line", label: "Trusted Solutions", theme: "green" },
    { icon: "ri-group-fill", label: "Expert Team", theme: "blue" },
    { icon: "ri-shield-check-fill", label: "Better Tomorrow", theme: "blue" },
];

const FOOTER_SOCIAL = [
    ...SOCIAL_LINKS.filter((s) => s.id !== "google"),
    { id: "youtube", icon: "ri-youtube-fill", label: "YouTube", url: "" },
];

const FooterLinkList = ({ title, items }) => (
    <div className="homeojob-footer__col">
        <h5 className="homeojob-footer__heading">{title}</h5>
        <ul className="homeojob-footer__list">
            {items.map((item) => (
                <li key={item.label}>
                    <Link to={item.to}>
                        <span>{item.label}</span>
                        <i className="ri-arrow-right-s-line" aria-hidden="true" />
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

const SocialIcon = ({ icon, label, url }) => {
    const inner = <i className={icon} aria-hidden="true" />;

    if (url) {
        return (
            <a
                href={url}
                className="homeojob-footer__social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
            >
                {inner}
            </a>
        );
    }

    return (
        <span className="homeojob-footer__social-btn" aria-label={label} title={label}>
            {inner}
        </span>
    );
};

const Footer = () => {
    const [email, setEmail] = useState("");

    const handleSubscribe = (event) => {
        event.preventDefault();
    };

    return (
        <footer className="homeojob-footer">
            <div className="homeojob-footer__wave" aria-hidden="true" />
            <div className="homeojob-footer__dots" aria-hidden="true" />
            <div className="homeojob-footer__leaf homeojob-footer__leaf--bl" aria-hidden="true">
                <i className="ri-leaf-fill" />
            </div>
            <div className="homeojob-footer__leaf homeojob-footer__leaf--br" aria-hidden="true">
                <i className="ri-leaf-fill" />
            </div>

            <Container className="position-relative">
                <Row className="g-4 g-xl-5 homeojob-footer__main">
                    <Col xl={3} lg={4}>
                        <div className="homeojob-footer__brand">
                            <Link to={landingPath()} className="homeojob-footer__logo">
                                <img src={LogoLight} alt={SITE.name} />
                            </Link>

                            <h3 className="homeojob-footer__tagline">
                                Better Health
                                <span>Naturally</span>
                            </h3>

                            <p className="homeojob-footer__about">{ABOUT_CONTENT.aboutHome.text}</p>

                            <div className="homeojob-footer__trust">
                                {TRUST_ITEMS.map((item) => (
                                    <div
                                        key={item.label}
                                        className={`homeojob-footer__trust-item homeojob-footer__trust-item--${item.theme}`}
                                    >
                                        <span className="homeojob-footer__trust-icon">
                                            <i className={item.icon} aria-hidden="true" />
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>

                    <Col xl={5} lg={8}>
                        <Row className="g-4">
                            <Col sm={4}>
                                <FooterLinkList title="Our Modules" items={MODULE_LINKS} />
                            </Col>
                            <Col sm={4}>
                                <FooterLinkList title="Quick Links" items={QUICK_LINKS} />
                            </Col>
                            <Col sm={4}>
                                <FooterLinkList title="Support" items={SUPPORT_LINKS} />
                            </Col>
                        </Row>
                    </Col>

                    <Col xl={4} lg={12}>
                        <div className="homeojob-footer__aside">
                            <div className="homeojob-footer__newsletter">
                                <span className="homeojob-footer__newsletter-icon" aria-hidden="true">
                                    <i className="ri-mail-line" />
                                </span>
                                <p className="homeojob-footer__newsletter-eyebrow">Stay Updated</p>
                                <h5 className="homeojob-footer__newsletter-title">
                                    Subscribe to our Newsletter
                                </h5>
                                <p className="homeojob-footer__newsletter-text">
                                    Get the latest updates, insights and homeopathy tips directly in
                                    your inbox.
                                </p>
                                <form
                                    className="homeojob-footer__newsletter-form"
                                    onSubmit={handleSubscribe}
                                >
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        aria-label="Email address"
                                    />
                                    <button type="submit" aria-label="Subscribe">
                                        <i className="ri-send-plane-fill" aria-hidden="true" />
                                    </button>
                                </form>
                            </div>

                            <div className="homeojob-footer__follow">
                                <h5 className="homeojob-footer__heading">Follow Us</h5>
                                <div className="homeojob-footer__social">
                                    {FOOTER_SOCIAL.map((social) => (
                                        <SocialIcon
                                            key={social.id}
                                            icon={social.icon}
                                            label={social.label}
                                            url={social.url}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="homeojob-footer__bottom">
                    <p className="homeojob-footer__copy">
                        {new Date().getFullYear()} © {SITE.copyright}. All Rights Reserved.
                    </p>

                    <div className="homeojob-footer__legal">
                        <Link to={landingPath("privacy")}>Privacy Policy</Link>
                        <span>|</span>
                        <Link to={landingPath("terms")}>Terms &amp; Conditions</Link>
                        <span>|</span>
                        <Link to={landingPath("contact")}>Contact Us</Link>
                    </div>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
