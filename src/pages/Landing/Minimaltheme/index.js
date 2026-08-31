import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import "../../../assets/scss/pages/minimaltheme-landing.scss";

import MinimalLayout from "./components/MinimalLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import AccountPage from "./pages/AccountPage";

const Minimaltheme = () => {
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
        <div className="layout-wrapper landing minimaltheme">
            <Routes>
                <Route element={<MinimalLayout />}>
                    <Route index element={<HomePage />} />
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
                </Route>
            </Routes>
        </div>
    );
};

export default Minimaltheme;
