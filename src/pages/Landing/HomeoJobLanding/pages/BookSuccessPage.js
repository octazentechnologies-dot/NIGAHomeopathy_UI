import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPaymentStatus } from "../../../../helpers/publicBookingApi";

const BookSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(Boolean(token));

    useEffect(() => {
        document.title = `${SITE.name} | Booking hold`;
        if (!token) {
            setError("Missing booking token.");
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        // PAT-19.02 — paymentStatus from GET Public/Bookings only
        getPaymentStatus(token)
            .then((row) => {
                if (!cancelled) {
                    setBooking(row);
                    setError("");
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || "Could not load this booking hold.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">Booking hold created</h1>
                {error ? <p className="text-danger">{error}</p> : null}
                {booking ? (
                    <div className="homeojob-doctor-detail__card p-4 mb-3">
                        <p className="mb-2">
                            <strong>Token:</strong> {booking.bookingToken ?? token}
                        </p>
                        <p className="mb-2">
                            <strong>Payment:</strong> {booking.paymentLabel}
                        </p>
                        <p className="mb-0 text-muted">
                            Your appointment time is held. Please pay at the clinic.
                        </p>
                    </div>
                ) : loading ? (
                    <p className="text-muted">Loading booking…</p>
                ) : null}
                {token ? (
                    <>
                        <Link
                            className="btn btn-primary me-2"
                            to={landingPath(`book/appointment/${encodeURIComponent(token)}`)}
                        >
                            Appointment detail
                        </Link>
                        <Link
                            className="btn btn-outline-primary me-2"
                            to={landingPath(`book/pay/${encodeURIComponent(token)}`)}
                        >
                            View payment status
                        </Link>
                    </>
                ) : null}
                <Link className="btn btn-outline-secondary" to={landingPath("book")}>
                    Book another doctor
                </Link>
            </Container>
        </section>
    );
};

export default BookSuccessPage;
