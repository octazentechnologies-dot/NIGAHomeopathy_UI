import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPaymentStatus } from "../../../../helpers/publicBookingApi";

/**
 * PAT-19.02 — payment status from New-API GET /api/Public/Bookings/{token}.
 * States: empty (no token) / loading / error / offline / content (paid | pending | failed).
 */
const BookPayPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [phase, setPhase] = useState("loading"); // empty | loading | error | offline | ready
    const [error, setError] = useState("");

    const load = useCallback(() => {
        if (!bookingId) {
            setPhase("empty");
            setError("Missing booking token.");
            setBooking(null);
            return undefined;
        }
        let cancelled = false;
        setPhase("loading");
        setError("");
        getPaymentStatus(bookingId)
            .then((row) => {
                if (cancelled) return;
                setBooking(row);
                setPhase("ready");
            })
            .catch((err) => {
                if (cancelled) return;
                if (err?.code === "OFFLINE") {
                    setPhase("offline");
                    setError(err.message);
                } else {
                    setPhase("error");
                    setError(err?.message || "Booking not found.");
                }
                setBooking(null);
            });
        return () => {
            cancelled = true;
        };
    }, [bookingId]);

    useEffect(() => {
        document.title = `${SITE.name} | Payment status`;
        return load();
    }, [load]);

    const kind = booking?.paymentKind ?? "pending";

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">Payment status</h1>
                <p className="text-muted mb-3">
                    Immediate confirmation of paid, pending, or failed — from the clinic booking API.
                </p>

                {phase === "empty" ? (
                    <p className="text-muted" role="status">
                        No booking token. Open this page from a booking hold link.
                    </p>
                ) : null}
                {phase === "loading" ? (
                    <p className="text-muted" role="status" aria-busy="true">
                        Loading payment status…
                    </p>
                ) : null}
                {phase === "offline" ? (
                    <div role="alert">
                        <p className="text-warning mb-2">{error}</p>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
                            Retry
                        </button>
                    </div>
                ) : null}
                {phase === "error" ? (
                    <div role="alert">
                        <p className="text-danger mb-2">{error}</p>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
                            Retry
                        </button>
                    </div>
                ) : null}

                {phase === "ready" && booking ? (
                    <div className="homeojob-doctor-detail__card p-4 mb-3">
                        <p className="mb-2">
                            <strong>Booking:</strong> {booking.bookingToken}
                        </p>
                        {booking.consultFee != null ? (
                            <p className="mb-2">
                                <strong>Fee:</strong> ₹{booking.consultFee}
                            </p>
                        ) : null}
                        <p className="mb-0" aria-live="polite">
                            <strong>Payment:</strong>{" "}
                            <span
                                className={
                                    kind === "paid"
                                        ? "text-success"
                                        : kind === "failed"
                                          ? "text-danger"
                                          : "text-warning"
                                }
                            >
                                {booking.paymentLabel}
                            </span>
                        </p>
                    </div>
                ) : null}

                {phase === "ready" && kind === "pending" ? (
                    <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() =>
                            navigate(landingPath(`book/pay/${encodeURIComponent(bookingId)}/success`))
                        }
                    >
                        I will pay at clinic
                    </button>
                ) : null}
                {phase === "ready" ? (
                    <button type="button" className="btn btn-outline-primary me-2" onClick={load}>
                        Refresh status
                    </button>
                ) : null}
                <Link className="btn btn-link" to={landingPath("book")}>
                    Back to book
                </Link>
            </Container>
        </section>
    );
};

export default BookPayPage;
