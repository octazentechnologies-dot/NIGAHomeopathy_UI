import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Collapse, Container, NavbarToggler } from "reactstrap";

import LogoDark from "../../../assets/images/logo-dark.png";
import LogoLight from "../../../assets/images/logo-light.png";
import { landingPath } from "../../../constants/landingRoutes";

const NAV_ITEMS = [
    { path: landingPath(), label: "Home", end: true },
    { path: landingPath("about"), label: "About" },
    { path: landingPath("features"), label: "Features" },
    { path: landingPath("pricing"), label: "Pricing" },
    { path: landingPath("blog"), label: "Blog" },
    { path: landingPath("news"), label: "News" },
    { path: landingPath("contact"), label: "Contact" },
];

const Navbar = () => {
    const [isOpenMenu, setisOpenMenu] = useState(false);
    const [navClass, setnavClass] = useState("");
    const location = useLocation();

    const toggle = () => setisOpenMenu(!isOpenMenu);

    useEffect(() => {
        const scrollNavigation = () => {
            if (document.documentElement.scrollTop > 50) {
                setnavClass(" is-sticky");
            } else {
                setnavClass("");
            }
        };
        window.addEventListener("scroll", scrollNavigation, true);
        return () => window.removeEventListener("scroll", scrollNavigation, true);
    }, []);

    useEffect(() => {
        setisOpenMenu(false);
    }, [location.pathname]);

    return (
        <nav className={`navbar navbar-expand-lg navbar-landing fixed-top job-navbar${navClass}`} id="navbar">
            <Container fluid className="custom-container">
                <Link className="navbar-brand homeojob-brand" to={landingPath()}>
                    <img src={LogoDark} className="card-logo card-logo-dark" alt="Homeocentrum" />
                    <img src={LogoLight} className="card-logo card-logo-light" alt="Homeocentrum" />
                </Link>
                <NavbarToggler
                    onClick={toggle}
                    className="navbar-toggler homeojob-navbar-toggler py-0 fs-20 text-dark border-0 shadow-none"
                    type="button"
                    aria-label="Toggle navigation"
                >
                    <i className="mdi mdi-menu"></i>
                </NavbarToggler>

                <Collapse isOpen={isOpenMenu} className="navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav homeojob-nav mx-auto mt-2 mt-lg-0" id="navbar-example">
                        {NAV_ITEMS.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `nav-link homeojob-nav__link${isActive ? " active" : ""}`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <div className="homeojob-nav-actions flex-shrink-0">
                        <Link to="/login" className="homeojob-nav-login">
                            <span className="homeojob-nav-login__icon" aria-hidden="true">
                                <i className="ri-login-circle-line" />
                            </span>
                            Login
                        </Link>
                        <Link to="/register" className="btn homeojob-nav-signup">
                            <i className="ri-user-add-line" aria-hidden="true" />
                            Sign Up
                        </Link>
                    </div>
                </Collapse>
            </Container>
        </nav>
    );
};

export default Navbar;
