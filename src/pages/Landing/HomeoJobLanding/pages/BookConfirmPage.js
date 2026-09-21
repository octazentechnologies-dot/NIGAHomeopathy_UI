import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import BookingConfirmModal from "../components/BookingConfirmModal";
import { getPublicDoctor, mapPublicDoctorCard } from "../../../../helpers/publicBookingApi";

const BookConfirmPage = () => {
    const { doctorId } = useParams();
    const [searchParams] = useSearchParams();
    const [doctor, setDoctor] = useState(null);
    const [loadError, setLoadError] = useState("");

    const mode = searchParams.get("mode") === "tele" ? "tele" : "clinic";
    const slot = searchParams.get("slot") || "";
    const dateRaw = searchParams.get("date");
    const bookingDate = dateRaw ? new Date(`${dateRaw}T00:00:00`) : new Date();
    bookingDate.setHours(0, 0, 0, 0);

    useEffect(() => {
        document.title = `${SITE.name} | Confirm booking`;
        let cancelled = false;
        getPublicDoctor(doctorId)
            .then((row) => {
                if (!cancelled) setDoctor(mapPublicDoctorCard(row));
            })
            .catch(() => {
                if (!cancelled) setLoadError("Doctor not found or not verified for directory.");
            });
        return () => {
            cancelled = true;
        };
    }, [doctorId]);

    if (loadError) {
        return (
            <section className="homeojob-doctor-detail">
                <Container>
                    <p className="text-danger py-5">{loadError}</p>
                    <Link to={landingPath("book")}>Back to book a doctor</Link>
                </Container>
            </section>
        );
    }

    if (!doctor) {
        return (
            <section className="homeojob-doctor-detail">
                <Container>
                    <p className="text-muted py-5">Loading confirmation…</p>
                </Container>
            </section>
        );
    }

    if (!slot) {
        return (
            <section className="homeojob-doctor-detail">
                <Container className="py-5">
                    <p>Choose a slot first.</p>
                    <Link to={landingPath(`book/${doctor.id}/slots`)}>Open slots</Link>
                </Container>
            </section>
        );
    }

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-3">
                <nav className="homeojob-doctor-detail__breadcrumb" aria-label="Breadcrumb">
                    <Link to={landingPath("book")}>Book</Link>
                    <span aria-hidden="true">&gt;</span>
                    <Link to={landingPath(`book/${doctor.id}/slots`)}>Slots</Link>
                    <span aria-hidden="true">&gt;</span>
                    <span>Confirm</span>
                </nav>
            </Container>
            <BookingConfirmModal
                isOpen
                asPage
                doctor={doctor}
                consultMode={mode}
                bookingDate={bookingDate}
                selectedSlot={slot}
                onClose={() => window.history.back()}
            />
        </section>
    );
};

export default BookConfirmPage;
