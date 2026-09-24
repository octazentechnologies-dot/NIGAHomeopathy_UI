import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { loadAppointmentDetailScreen } from "../../../../helpers/publicBookingApi";

/**
 * PAT-20.02 — appointment detail from Phase 8–15 APIs only.
 * Public visit/payment via booking token; change log + tele summary when Bearer is available.
 */
const AppointmentDetailPage = () => {
    const { bookingToken: tokenParam } = useParams();
    const [searchParams] = useSearchParams();
    const token = tokenParam || searchParams.get("token") || "";
    const accessToken = searchParams.get("accessToken") || "";

    const [payload, setPayload] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(Boolean(token));
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        document.title = `${SITE.name} | Appointment detail`;
        if (!token) {
            setError("");
            setPayload(null);
            setLoading(false);
            setOffline(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        setError("");
        setOffline(false);
        loadAppointmentDetailScreen(token, { accessToken: accessToken || undefined })
            .then((row) => {
                if (!cancelled) setPayload(row);
            })
            .catch((err) => {
                if (cancelled) return;
                if (err?.code === "OFFLINE") {
                    setOffline(true);
                    setError(err.message);
                } else {
                    setError(err?.message || "Could not load appointment detail.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [token, accessToken]);

    const detail = payload?.detail;

    return (
        <section className="homeojob-doctor-detail" data-testid="appointment-detail">
            <Container className="py-5" style={{ maxWidth: 720 }}>
                <h1 className="h3 mb-3">Appointment detail</h1>

                {!token ? (
                    <p className="text-muted" data-testid="appointment-detail-empty">
                        No booking token. Open this page from a booking hold or add{" "}
                        <code>?token=…</code>.
                    </p>
                ) : null}

                {loading ? (
                    <p className="text-muted" data-testid="appointment-detail-loading">
                        Loading appointment…
                    </p>
                ) : null}

                {offline ? (
                    <p className="text-warning" data-testid="appointment-detail-offline">
                        {error}
                    </p>
                ) : null}

                {!loading && error && !offline ? (
                    <p className="text-danger" data-testid="appointment-detail-error">
                        {error}
                    </p>
                ) : null}

                {detail ? (
                    <div
                        className="homeojob-doctor-detail__card p-4 mb-3"
                        data-testid="appointment-detail-body"
                    >
                        <p className="mb-2">
                            <strong>When:</strong> {detail.appointmentDate} {detail.appointmentTime}
                        </p>
                        <p className="mb-2">
                            <strong>Status:</strong> {detail.status}
                        </p>
                        <p className="mb-2">
                            <strong>Mode:</strong> {detail.consultMode || detail.visitType}
                            {detail.isTele ? " (tele)" : ""}
                        </p>
                        <p className="mb-2">
                            <strong>Payment:</strong> {detail.paymentLabel}{" "}
                            <span className="text-muted">({detail.paymentStatus})</span>
                        </p>
                        {detail.consultFee != null ? (
                            <p className="mb-2">
                                <strong>Fee:</strong> ₹{detail.consultFee}
                            </p>
                        ) : null}
                        <p className="mb-0 text-muted small">
                            Payment and visit status come from the API only — nothing is marked paid
                            or signed on this device.
                        </p>
                    </div>
                ) : null}

                {payload && accessToken ? (
                    <>
                        <h2 className="h5 mt-4">Change log</h2>
                        {payload.changeLogError ? (
                            <p className="text-warning small">{payload.changeLogError}</p>
                        ) : null}
                        {payload.changeLog?.length ? (
                            <ul className="list-unstyled" data-testid="appointment-change-log">
                                {payload.changeLog.map((row) => (
                                    <li
                                        key={
                                            row.appointmentChangeLogId ??
                                            row.AppointmentChangeLogId ??
                                            `${row.at}-${row.action}`
                                        }
                                        className="homeojob-doctor-detail__card p-3 mb-2"
                                    >
                                        <strong>{row.action ?? row.Action}</strong>
                                        <span className="text-muted small ms-2">
                                            {row.at ?? row.At}
                                        </span>
                                        <div className="small">
                                            {(row.oldValue ?? row.OldValue) || "—"} →{" "}
                                            {(row.newValue ?? row.NewValue) || "—"}
                                        </div>
                                        {(row.reason ?? row.Reason) ? (
                                            <div className="small text-muted">
                                                {row.reason ?? row.Reason}
                                            </div>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted small">No changes recorded yet.</p>
                        )}

                        <h2 className="h5 mt-4">Tele summary</h2>
                        {payload.teleSummaryError ? (
                            <p className="text-warning small">{payload.teleSummaryError}</p>
                        ) : null}
                        {payload.teleSummaries?.length ? (
                            <ul className="list-unstyled" data-testid="appointment-tele-summary">
                                {payload.teleSummaries.map((row) => (
                                    <li
                                        key={
                                            row.consultationSummaryId ??
                                            row.ConsultationSummaryId ??
                                            row.at
                                        }
                                        className="homeojob-doctor-detail__card p-3 mb-2"
                                    >
                                        <div>{row.text ?? row.Text}</div>
                                        <div className="small text-muted">{row.at ?? row.At}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted small">No tele summary yet.</p>
                        )}
                    </>
                ) : payload ? (
                    <p className="text-muted small mt-3">
                        Sign in as the patient (or treating doctor) to load change log and tele
                        summary for this visit.
                    </p>
                ) : null}

                <div className="mt-4">
                    {token ? (
                        <Link
                            className="btn btn-primary me-2"
                            to={landingPath(`book/pay/${encodeURIComponent(token)}`)}
                        >
                            Payment status
                        </Link>
                    ) : null}
                    {token &&
                    detail &&
                    String(detail.status || "").toUpperCase() !== "CANCELLED" ? (
                        <Link
                            className="btn btn-outline-danger me-2"
                            to={`${landingPath(`book/appointment/${encodeURIComponent(token)}/cancel`)}${
                                accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : ""
                            }`}
                        >
                            Cancel appointment
                        </Link>
                    ) : null}
                    <Link className="btn btn-outline-secondary" to={landingPath("book")}>
                        Find a doctor
                    </Link>
                </div>
            </Container>
        </section>
    );
};

export default AppointmentDetailPage;
