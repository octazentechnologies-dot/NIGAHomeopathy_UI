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
import FindDoctorPage from "./pages/FindDoctorPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import BookSlotsPage from "./pages/BookSlotsPage";
import BookConfirmPage from "./pages/BookConfirmPage";
import BookSuccessPage from "./pages/BookSuccessPage";
import BookPayPage from "./pages/BookPayPage";
import BookPayResultPage from "./pages/BookPayResultPage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import CancelAppointmentPage from "./pages/CancelAppointmentPage";
import InstantConsultPage from "./pages/InstantConsultPage";
import InstantQueueOfferPage from "./pages/InstantQueueOfferPage";
import DeviceCheckPage from "./pages/DeviceCheckPage";
import RecordingConsentPage from "./pages/RecordingConsentPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import HelpCentrePage from "./pages/HelpCentrePage";
import HelpArticlePage from "./pages/HelpArticlePage";

const HomeoJobLanding = () => {
    useEffect(() => {
        const previousTheme = document.body.getAttribute("data-bs-theme");
        const previousOverflowX = document.body.style.overflowX;
        const previousHtmlOverflowX = document.documentElement.style.overflowX;

        document.body.setAttribute("data-bs-theme", "light");
        document.body.style.overflowX = "hidden";
        document.documentElement.style.overflowX = "hidden";

        return () => {
            document.body.style.overflowX = previousOverflowX;
            document.documentElement.style.overflowX = previousHtmlOverflowX;
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
                    <Route path="help" element={<HelpCentrePage />} />
                    <Route path="help/:slug" element={<HelpArticlePage />} />
                    <Route path="account" element={<AccountPage />} />
                    <Route path="find-doctor" element={<FindDoctorPage />} />
                    <Route path="find-doctor/:doctorId" element={<DoctorDetailPage />} />
                    <Route path="book" element={<FindDoctorPage />} />
                    <Route path="instant-consult" element={<InstantConsultPage />} />
                    <Route path="instant-consult/queue" element={<InstantQueueOfferPage />} />
                    <Route path="device-check" element={<DeviceCheckPage />} />
                    <Route path="recording-consent" element={<RecordingConsentPage />} />
                    <Route path="tele/waiting/:sessionId" element={<WaitingRoomPage />} />
                    <Route path="tele/waiting" element={<WaitingRoomPage />} />
                    <Route path="book/success" element={<BookSuccessPage />} />
                    <Route path="book/appointment/:bookingToken/cancel" element={<CancelAppointmentPage />} />
                    <Route path="book/appointment/:bookingToken" element={<AppointmentDetailPage />} />
                    <Route path="book/pay/:bookingId/success" element={<BookPayResultPage outcome="success" />} />
                    <Route path="book/pay/:bookingId/failure" element={<BookPayResultPage outcome="failure" />} />
                    <Route path="book/pay/:bookingId" element={<BookPayPage />} />
                    <Route path="book/:doctorId/slots" element={<BookSlotsPage />} />
                    <Route path="book/:doctorId/confirm" element={<BookConfirmPage />} />
                    <Route path="book/:doctorId" element={<DoctorDetailPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </div>
    );
};

export default HomeoJobLanding;
