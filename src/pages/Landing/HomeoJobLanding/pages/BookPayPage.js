import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPublicBooking } from "../../../../helpers/publicBookingApi";

const BookPayPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = `${SITE.name} | Pay for booking`;
        if (!bookingId) return undefined;
        let cancelled = false;
        getPublicBooking(bookingId)
            .then((row) => {
                if (!cancelled) setBooking(row);
            })
            .catch(() => {
                if (!cancelled) setError("Booking not found.");
            });
        return () => {
            cancelled = true;
        };
    }, [bookingId]);

    const status = booking?.paymentStatus ?? booking?.PaymentStatus ?? "PENDING";

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">Pay for this booking</h1>
                <p className="text-muted">
                    Online collect stays on classic Razorpay. This page records the hold and clinic-pay path.
                </p>
                {error ? <p className="text-danger">{error}</p> : null}
                {booking ? (
                    <div className="homeojob-doctor-detail__card p-4 mb-3">
                        <p className="mb-2">
                            <strong>Booking:</strong> {booking.bookingToken ?? booking.BookingToken ?? bookingId}
                        </p>
                        <p className="mb-0">
                            <strong>Current status:</strong> {status}
                        </p>
                    </div>
                ) : !error ? (
                    <p className="text-muted">Loading…</p>
                ) : null}
                <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={() => navigate(landingPath(`book/pay/${encodeURIComponent(bookingId)}/success`))}
                    disabled={!booking}
                >
                    I will pay at clinic
                </button>
                <button
                    type="button"
                    className="btn btn-outline-danger me-2"
                    onClick={() => navigate(landingPath(`book/pay/${encodeURIComponent(bookingId)}/failure`))}
                    disabled={!booking}
                >
                    Payment failed
                </button>
                <Link className="btn btn-link" to={landingPath("book")}>
                    Cancel
                </Link>
            </Container>
        </section>
    );
};

export default BookPayPage;
