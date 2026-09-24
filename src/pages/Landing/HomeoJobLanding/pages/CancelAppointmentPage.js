import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Container, Input, Label } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    CANCEL_REASON_CODES,
    cancelPatientAppointment,
    loadCancelAppointmentScreen,
} from "../../../../helpers/publicBookingApi";

/**
 * PAT-22.02 — cancel appointment via New-API CancelAppointment (Bearer).
 * States: empty / loading / error / offline / ready / done.
 * Status CANCELLED only from API — never invented on the device.
 */
const CancelAppointmentPage = () => {
    const { bookingToken: tokenParam } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = tokenParam || searchParams.get("token") || "";
    const accessToken = searchParams.get("accessToken") || "";

    const [detail, setDetail] = useState(null);
    const [phase, setPhase] = useState("loading");
    const [error, setError] = useState("");
    const [reasonCode, setReasonCode] = useState("PatientRequest");
    const [reasonText, setReasonText] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);

    const load = useCallback(() => {
        if (!token) {
            setPhase("empty");
            setError("Missing booking token.");
            setDetail(null);
            return undefined;
        }
        let cancelled = false;
        setPhase("loading");
        setError("");
        setResult(null);
        loadCancelAppointmentScreen(token, { accessToken: accessToken || undefined })
            .then((row) => {
                if (cancelled) return;
                setDetail(row.detail);
                if (row.alreadyCancelled) {
                    setPhase("done");
                    setResult({
                        message: "Appointment is already cancelled.",
                        status: "CANCELLED",
                        cancelReasonCode: row.detail.cancelReasonCode,
                        patientAppId: row.detail.patientAppId,
                    });
                } else {
                    setPhase("ready");
                }
            })
            .catch((err) => {
                if (cancelled) return;
                if (err?.code === "OFFLINE") {
                    setPhase("offline");
                    setError(err.message);
                } else {
                    setPhase("error");
                    setError(err?.message || "Could not load appointment.");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [token, accessToken]);

    useEffect(() => {
        document.title = `${SITE.name} | Cancel appointment`;
        return load();
    }, [load]);

    const submitCancel = async () => {
        if (!detail?.patientAppId) return;
        if (!accessToken) {
            setError("Sign in as the patient to cancel. Pass accessToken in the URL.");
            return;
        }
        if (reasonCode === "Other" && !reasonText.trim()) {
            setError("Other needs a reason.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const res = await cancelPatientAppointment({
                patientAppId: detail.patientAppId,
                reasonCode,
                reasonText,
                accessToken,
            });
            setResult(res);
            setPhase("done");
            setDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          status: res.status || "CANCELLED",
                          cancelReasonCode: res.cancelReasonCode,
                      }
                    : prev
            );
        } catch (err) {
            if (err?.code === "OFFLINE") {
                setPhase("offline");
                setError(err.message);
            } else {
                setError(err?.message || "Could not cancel.");
            }
        } finally {
            setBusy(false);
        }
    };

    const qs = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : "";

    return (
        <section className="homeojob-doctor-detail" data-testid="cancel-appointment">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">Cancel appointment</h1>
                <p className="text-muted mb-3">
                    Cancels the visit on the clinic system. Payment is not refunded from this screen.
                </p>

                {phase === "empty" ? (
                    <p className="text-muted" data-testid="cancel-empty" role="status">
                        No booking token. Open this page from an appointment link.
                    </p>
                ) : null}
                {phase === "loading" ? (
                    <p className="text-muted" data-testid="cancel-loading" role="status" aria-busy="true">
                        Loading appointment…
                    </p>
                ) : null}
                {phase === "offline" ? (
                    <div role="alert" data-testid="cancel-offline">
                        <p className="text-warning mb-2">{error}</p>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
                            Retry
                        </button>
                    </div>
                ) : null}
                {phase === "error" ? (
                    <div role="alert" data-testid="cancel-error">
                        <p className="text-danger mb-2">{error}</p>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
                            Retry
                        </button>
                    </div>
                ) : null}

                {(phase === "ready" || phase === "done") && detail ? (
                    <div className="homeojob-doctor-detail__card p-4 mb-3" data-testid="cancel-body">
                        <p className="mb-2">
                            <strong>Visit #</strong>
                            {detail.patientAppId}
                        </p>
                        <p className="mb-2">
                            <strong>When:</strong> {detail.appointmentDate} {detail.appointmentTime}
                        </p>
                        <p className="mb-2">
                            <strong>Status:</strong> {detail.status}
                        </p>
                        <p className="mb-0">
                            <strong>Payment:</strong> {detail.paymentLabel}{" "}
                            <span className="text-muted">({detail.paymentStatus})</span>
                        </p>
                    </div>
                ) : null}

                {phase === "ready" && !accessToken ? (
                    <p className="text-warning" role="status">
                        Sign in as the patient who owns this visit, then open this page with{" "}
                        <code>accessToken</code> to cancel.
                    </p>
                ) : null}

                {phase === "ready" && accessToken ? (
                    <div className="mb-3">
                        <Label htmlFor="cancel-reason" className="form-label">
                            Reason
                        </Label>
                        <Input
                            id="cancel-reason"
                            type="select"
                            value={reasonCode}
                            onChange={(e) => setReasonCode(e.target.value)}
                            aria-label="Cancel reason"
                        >
                            {CANCEL_REASON_CODES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </Input>
                        {reasonCode === "Other" ? (
                            <>
                                <Label htmlFor="cancel-reason-text" className="form-label mt-2">
                                    Details
                                </Label>
                                <Input
                                    id="cancel-reason-text"
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    aria-label="Cancel reason details"
                                />
                            </>
                        ) : null}
                        {error ? (
                            <p className="text-danger mt-2 mb-0" role="alert">
                                {error}
                            </p>
                        ) : null}
                        <button
                            type="button"
                            className="btn btn-danger mt-3 me-2"
                            disabled={busy || !detail?.patientAppId}
                            onClick={submitCancel}
                            aria-label="Confirm cancel visit"
                        >
                            {busy ? "Cancelling…" : "Cancel visit"}
                        </button>
                    </div>
                ) : null}

                {phase === "done" && result ? (
                    <div className="alert alert-success" role="status" data-testid="cancel-done" aria-live="polite">
                        <p className="mb-1">{result.message}</p>
                        <p className="mb-0 small">
                            Status <strong>{result.status}</strong>
                            {result.cancelReasonCode ? ` · ${result.cancelReasonCode}` : ""}
                        </p>
                    </div>
                ) : null}

                <div className="mt-3">
                    {token ? (
                        <Link
                            className="btn btn-outline-primary me-2"
                            to={`${landingPath(`book/appointment/${encodeURIComponent(token)}`)}${qs}`}
                        >
                            Appointment detail
                        </Link>
                    ) : null}
                    <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => navigate(landingPath("book"))}
                    >
                        Find a doctor
                    </button>
                </div>
            </Container>
        </section>
    );
};

export default CancelAppointmentPage;
