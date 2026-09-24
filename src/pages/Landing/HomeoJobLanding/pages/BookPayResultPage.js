import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPaymentStatus } from "../../../../helpers/publicBookingApi";

/**
 * PAT-19.02 — result screen re-reads paymentStatus from New-API (not a local outcome flag).
 */
const BookPayResultPage = ({ outcome }) => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [phase, setPhase] = useState("loading");
    const [error, setError] = useState("");

    const load = useCallback(() => {
        if (!bookingId) {
            setPhase("empty");
            setError("Missing booking token.");
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
                    setError(err?.message || "Could not load payment status.");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [bookingId]);

    useEffect(() => {
        document.title = `${SITE.name} | Payment status`;
        return load();
    }, [load]);

    const kind = booking?.paymentKind ?? (outcome === "success" ? "pending" : outcome === "failure" ? "failed" : "pending");
    const title =
        kind === "paid" ? "Payment confirmed" : kind === "failed" ? "Payment failed" : "Payment pending";

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">{title}</h1>

                {phase === "loading" ? (
                    <p className="text-muted" role="status" aria-busy="true">
                        Checking payment status…
                    </p>
                ) : null}
                {phase === "offline" || phase === "error" || phase === "empty" ? (
                    <div role="alert">
                        <p className={phase === "offline" ? "text-warning" : "text-danger"}>{error}</p>
                        {phase !== "empty" ? (
                            <button type="button" className="btn btn-outline-secondary btn-sm mb-3" onClick={load}>
                                Retry
                            </button>
                        ) : null}
                    </div>
                ) : null}

                {phase === "ready" && booking ? (
                    <p className="text-muted mb-3" aria-live="polite">
                        {booking.paymentLabel}
                        {booking.consultFee != null ? ` · Fee ₹${booking.consultFee}` : ""}
                    </p>
                ) : null}

                {kind === "paid" || kind === "pending" ? (
                    <Link className="btn btn-primary" to={landingPath()}>
                        Back to home
                    </Link>
                ) : (
                    <Link
                        className="btn btn-primary"
                        to={landingPath(`book/pay/${encodeURIComponent(bookingId || "")}`)}
                    >
                        Check payment again
                    </Link>
                )}
            </Container>
        </section>
    );
};

export default BookPayResultPage;
