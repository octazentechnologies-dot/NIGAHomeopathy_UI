import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPaymentStatus, createPublicConsultOrder, getPublicFee } from "../../../../helpers/publicBookingApi";
import { s4Message, unwrapS4 } from "../../../../helpers/s4Week4Api";

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

/**
 * PAT-19.02 / PAY — payment status from New-API GET /api/Public/Bookings/{token}.
 * Online pay uses CreateConsultOrder on :5002 with the booking token (Razorpay keys stay empty until S5).
 * Paid is confirmed only by webhook — this page refreshes status after checkout.
 */
const BookPayPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [phase, setPhase] = useState("loading"); // empty | loading | error | offline | ready
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);
    const [clinicPayEnabled, setClinicPayEnabled] = useState(true);

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
                const enabled = row?.payAtClinicEnabled ?? row?.PayAtClinicEnabled;
                if (enabled === false) setClinicPayEnabled(false);
                else if (row?.doctorId || row?.DoctorId) {
                    getPublicFee(row.doctorId || row.DoctorId)
                        .then((feeRow) => {
                            const flag = feeRow?.payAtClinicEnabled ?? feeRow?.PayAtClinicEnabled;
                            setClinicPayEnabled(flag !== false);
                        })
                        .catch(() => setClinicPayEnabled(true));
                }
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

    const payOnline = async () => {
        const patientAppId = Number(booking?.patientAppId || 0);
        if (!patientAppId) {
            setError("This booking has no appointment id yet. Try refresh, or pay at clinic.");
            return;
        }
        setPaying(true);
        setError("");
        try {
            const response = await createPublicConsultOrder({
                patientAppId,
                payAtClinic: false,
                bookingToken: bookingId,
                idempotencyKey: `book-${bookingId || patientAppId}`,
            });
            const body = unwrapS4(response);
            const gatewayReady = Boolean(response?.gatewayReady ?? body?.gatewayReady);
            const keyId = response?.keyId || body?.keyId;
            const order = body?.data || body;
            const gatewayOrderId = order?.gatewayOrderId || order?.GatewayOrderId;
            const amount = Number(order?.amount ?? order?.Amount ?? booking?.consultFee ?? 0);

            if (!gatewayReady || !keyId || !gatewayOrderId) {
                setError(
                    response?.message ||
                        body?.message ||
                        "Online checkout is not ready. Use pay at clinic, or ask reception to collect."
                );
                return;
            }

            const ok = await loadRazorpayScript();
            if (!ok || !window.Razorpay) {
                setError("Could not load the payment checkout.");
                return;
            }

            const rzp = new window.Razorpay({
                key: keyId,
                amount: Math.round(amount * 100),
                currency: order?.currency || order?.Currency || "INR",
                name: SITE.name || "Homeocentrum",
                description: "Consultation fee",
                order_id: gatewayOrderId,
                handler: () => {
                    // Paid only after webhook — refresh public status.
                    navigate(landingPath(`book/pay/${encodeURIComponent(bookingId)}/success`));
                },
                theme: { color: "#0ab39c" },
            });
            rzp.on("payment.failed", () => {
                navigate(landingPath(`book/pay/${encodeURIComponent(bookingId)}/failure`));
            });
            rzp.open();
        } catch (err) {
            setError(s4Message(err));
        } finally {
            setPaying(false);
        }
    };

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">Payment status</h1>
                <p className="text-muted mb-3">
                    Immediate confirmation of paid, pending, or failed — from the clinic booking API.
                    Online checkout needs gateway keys on the New API (empty until S5). Pay at clinic still works.
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
                {phase === "ready" && error ? (
                    <p className="text-danger" role="alert">{error}</p>
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
                    <>
                        <button
                            type="button"
                            className="btn btn-primary me-2"
                            disabled={paying || !booking?.patientAppId}
                            onClick={payOnline}
                        >
                            {paying ? "Starting checkout…" : "Pay online"}
                        </button>
                        {clinicPayEnabled ? (
                        <button
                            type="button"
                            className="btn btn-success me-2"
                            disabled={paying || !booking?.patientAppId}
                            onClick={async () => {
                                const patientAppId = Number(booking?.patientAppId || 0);
                                if (!patientAppId) return;
                                setPaying(true);
                                setError("");
                                try {
                                    await createPublicConsultOrder({
                                        patientAppId,
                                        payAtClinic: true,
                                        bookingToken: bookingId,
                                        idempotencyKey: `clinic-${bookingId || patientAppId}`,
                                    });
                                    navigate(landingPath(`book/pay/${encodeURIComponent(bookingId)}/success`));
                                } catch (err) {
                                    setError(s4Message(err));
                                } finally {
                                    setPaying(false);
                                }
                            }}
                        >
                            I will pay at clinic
                        </button>
                        ) : null}
                    </>
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
