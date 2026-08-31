import React, { useState, useEffect } from "react";
import { Collapse, Container, NavbarToggler } from "reactstrap";
import { Link, NavLink, useLocation } from "react-router-dom";

import logodark from "../../../assets/images/logo-dark.png";
import logolight from "../../../assets/images/logo-light.png";
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
                setnavClass("is-sticky");
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
        <nav className={"navbar navbar-expand-lg navbar-landing fixed-top " + navClass} id="navbar">
            <Container>
                <Link className="navbar-brand minimaltheme-brand" to={landingPath()}>
                    <img src={logodark} className="card-logo card-logo-dark" alt="Homeo Centrum" />
                    <img src={logolight} className="card-logo card-logo-light" alt="Homeo Centrum" />
                </Link>

                <NavbarToggler
                    className="navbar-toggler py-0 fs-20 text-dark"
                    onClick={toggle}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <i className="mdi mdi-menu"></i>
                </NavbarToggler>

                <Collapse isOpen={isOpenMenu} className="navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mx-auto mt-2 mt-lg-0" id="navbar-example">
                        {NAV_ITEMS.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) => `nav-link fs-15${isActive ? " active" : ""}`}
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                    <div>
                        <Link to="/login" className="btn btn-link fw-medium text-decoration-none text-dark">
                            Sign in
                        </Link>
                        <Link to="/register" className="btn btn-primary">Sign Up</Link>
                    </div>
                </Collapse>
            </Container>
        </nav>
    );
};

export default Navbar;
