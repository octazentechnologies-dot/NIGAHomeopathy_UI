import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";

const HomeoJobLayout = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const btn = document.getElementById("back-to-top");
        const scrollFunction = () => {
            if (!btn) return;
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                btn.style.display = "block";
            } else {
                btn.style.display = "none";
            }
        };
        window.addEventListener("scroll", scrollFunction, true);
        return () => window.removeEventListener("scroll", scrollFunction, true);
    }, []);

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
            <button
                onClick={toTop}
                className="btn btn-danger btn-icon landing-back-top"
                id="back-to-top"
                style={{ display: "none" }}
                type="button"
                aria-label="Back to top"
            >
                <i className="ri-arrow-up-line"></i>
            </button>
        </>
    );
};

export default HomeoJobLayout;
