import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import "../../../assets/scss/pages/homeojob-landing.scss";

import HomeoJobLayout from "./components/HomeoJobLayout";
import HomeLandingPage from "./HomeLandingPage";
import AboutPage from "../Minimaltheme/pages/AboutPage";
import FeaturesPage from "../Minimaltheme/pages/FeaturesPage";
import PricingPage from "../Minimaltheme/pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import ContactPage from "../Minimaltheme/pages/ContactPage";
import PrivacyPage from "../Minimaltheme/pages/PrivacyPage";
import TermsPage from "../Minimaltheme/pages/TermsPage";
import AccountPage from "../Minimaltheme/pages/AccountPage";

const HomeoJobLanding = () => {
    useEffect(() => {
        const previousTheme = document.body.getAttribute("data-bs-theme");
        document.body.setAttribute("data-bs-theme", "light");
        return () => {
            if (previousTheme) {
                document.body.setAttribute("data-bs-theme", previousTheme);
            } else {
                document.body.removeAttribute("data-bs-theme");
            }
        };
    }, []);

    return (
        <div className="layout-wrapper landing homeojoblanding">
            <Routes>
                <Route element={<HomeoJobLayout />}>
                    <Route index element={<HomeLandingPage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="features" element={<FeaturesPage />} />
                    <Route path="pricing" element={<PricingPage />} />
                    <Route path="blog" element={<BlogPage />} />
                    <Route path="blog/:blogId" element={<BlogDetailPage />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="news/:newsId" element={<NewsDetailPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="privacy" element={<PrivacyPage />} />
                    <Route path="terms" element={<TermsPage />} />
                    <Route path="account" element={<AccountPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </div>
    );
};

export default HomeoJobLanding;
