import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Collapse, Container, NavbarToggler } from "reactstrap";

import LogoDark from "../../../assets/images/logo-dark.png";
import LogoLight from "../../../assets/images/logo-light.png";
import { landingPath } from "../../../constants/landingRoutes";
import { UserRole } from "../../../Components/constants/roles";
import { getAuthUserInfo } from "../../../helpers/dashboard_helper";

const NAV_ITEMS = [
    { id: "home", path: landingPath(), label: "Home", end: true },
    {
        id: "book",
        path: landingPath("book"),
        label: "Book",
        match: ["/book", "/find-doctor", "/instant-consult"],
        children: [
            { path: landingPath("book"), label: "Find a Doctor" },
            { path: landingPath("instant-consult"), label: "Instant Consultation" },
        ],
    },
    {
        id: "about",
        path: landingPath("about"),
        label: "About",
        match: ["/about", "/features", "/pricing"],
        children: [
            { path: landingPath("about"), label: "About Us" },
            { path: landingPath("features"), label: "Features" },
            { path: landingPath("pricing"), label: "Pricing" },
        ],
    },
    {
        id: "updates",
        label: "Updates",
        match: ["/blog", "/news"],
        children: [
            { path: landingPath("blog"), label: "Blog" },
            { path: landingPath("news"), label: "News" },
        ],
    },
    {
        id: "support",
        label: "Support",
        match: ["/help", "/contact"],
        children: [
            { path: landingPath("help"), label: "Help Centre" },
            { path: landingPath("contact"), label: "Contact" },
        ],
    },
];

const pathIsCurrent = (pathname, item) => {
    if (item.end) return pathname === item.path;
    const targets = item.match || (item.path ? [item.path] : []);
    return targets.some((target) => pathname === target || pathname.startsWith(`${target}/`));
};

const Navbar = () => {
    const [isOpenMenu, setisOpenMenu] = useState(false);
    const [openDrop, setOpenDrop] = useState(null);
    const [navClass, setnavClass] = useState("");
    const location = useLocation();
    const signedIn = getAuthUserInfo();
    const signedInRole = signedIn?.role || signedIn?.Role;
    const brandPath = signedInRole === UserRole.PATIENT ? "/patientdashboard" : landingPath();

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
        setOpenDrop(null);
    }, [location.pathname]);

    return (
        <nav className={`navbar navbar-expand-lg navbar-landing fixed-top job-navbar${navClass}`} id="navbar">
            <Container fluid className="custom-container">
                <Link className="navbar-brand homeojob-brand" to={brandPath}>
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
                        {NAV_ITEMS.map((item) => {
                            const current = pathIsCurrent(location.pathname, item);
                            if (!item.children) {
                                return (
                                    <li className="nav-item homeojob-nav__item" key={item.id}>
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
                                );
                            }

                            const opened = openDrop === item.id;
                            return (
                                <li
                                    className={`nav-item homeojob-nav__item${opened ? " is-open" : ""}${current ? " is-current" : ""}`}
                                    key={item.id}
                                    onMouseEnter={() => {
                                        if (window.innerWidth >= 992) setOpenDrop(item.id);
                                    }}
                                    onMouseLeave={() => {
                                        if (window.innerWidth >= 992) setOpenDrop(null);
                                    }}
                                >
                                    {item.path ? (
                                        <NavLink
                                            to={item.path}
                                            className={`nav-link homeojob-nav__link homeojob-nav__parent${current ? " active" : ""}`}
                                            aria-expanded={opened}
                                            aria-haspopup="true"
                                            onClick={(event) => {
                                                if (window.innerWidth < 992) {
                                                    event.preventDefault();
                                                    setOpenDrop(opened ? null : item.id);
                                                }
                                            }}
                                        >
                                            {item.label}
                                            <i className="ri-arrow-down-s-line" aria-hidden="true" />
                                        </NavLink>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`nav-link homeojob-nav__link homeojob-nav__parent${current ? " active" : ""}`}
                                            aria-expanded={opened}
                                            aria-haspopup="true"
                                            onClick={() => setOpenDrop(opened ? null : item.id)}
                                        >
                                            {item.label}
                                            <i className="ri-arrow-down-s-line" aria-hidden="true" />
                                        </button>
                                    )}
                                    <div className="homeojob-nav__menu" role="menu">
                                        {item.children.map((child) => (
                                            <NavLink
                                                key={child.path}
                                                to={child.path}
                                                role="menuitem"
                                                className={({ isActive }) =>
                                                    `homeojob-nav__sublink${isActive ? " is-active" : ""}`
                                                }
                                                onClick={() => setOpenDrop(null)}
                                            >
                                                {child.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                </li>
                            );
                        })}
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
