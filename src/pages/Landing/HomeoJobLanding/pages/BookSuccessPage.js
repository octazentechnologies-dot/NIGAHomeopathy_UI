import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPublicBooking } from "../../../../helpers/publicBookingApi";

const BookSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = `${SITE.name} | Booking hold`;
        if (!token) {
            setError("Missing booking token.");
            return undefined;
        }
        let cancelled = false;
        getPublicBooking(token)
            .then((row) => {
                if (!cancelled) setBooking(row);
            })
            .catch(() => {
                if (!cancelled) setError("Could not load this booking hold.");
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
                            <strong>Token:</strong> {booking.bookingToken ?? booking.BookingToken ?? token}
                        </p>
                        <p className="mb-2">
                            <strong>Payment:</strong>{" "}
                            {booking.paymentStatus ?? booking.PaymentStatus ?? "PENDING"}
                        </p>
                        <p className="mb-0 text-muted">
                            Slot is held. Razorpay checkout stays on the classic clinic API. Pay at the clinic
                            or continue to the pay page.
                        </p>
                    </div>
                ) : !error ? (
                    <p className="text-muted">Loading booking…</p>
                ) : null}
                {token ? (
                    <Link className="btn btn-primary me-2" to={landingPath(`book/pay/${encodeURIComponent(token)}`)}>
                        Continue to pay
                    </Link>
                ) : null}
                <Link className="btn btn-outline-secondary" to={landingPath("book")}>
                    Book another doctor
                </Link>
            </Container>
        </section>
    );
};

export default BookSuccessPage;
