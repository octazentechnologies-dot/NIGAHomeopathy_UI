import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { postTeleRecordingConsent } from "../../../../helpers/publicBookingApi";

/**
 * PAT-29.02 — recording consent via POST /api/Tele/Consent (Bearer).
 * recordAllowed is true only when both doctor and patient accepted — from API only.
 * TeleSessionId comes from the visit deep-link / waiting room — never typed by the patient.
 */
const RecordingConsentPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const accessToken = searchParams.get("accessToken") || "";
    const sessionFromUrl = searchParams.get("teleSessionId") || "";

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);

    const teleSessionId = sessionFromUrl;

    useEffect(() => {
        document.title = `${SITE.name} | Recording consent`;
    }, []);

    const submit = async (accepted) => {
        setError("");
        setResult(null);
        setOffline(false);
        if (!teleSessionId) {
            setError("Open this screen from your waiting room or visit link (session is required).");
            return;
        }
        if (!accessToken) {
            setError("Sign in and open consent from your tele visit link.");
            return;
        }
        setLoading(true);
        try {
            const row = await postTeleRecordingConsent({
                teleSessionId,
                accepted,
                accessToken,
            });
            setResult(row);
            const next = new URLSearchParams(searchParams);
            next.set("teleSessionId", String(row.teleSessionId));
            setSearchParams(next, { replace: true });
        } catch (err) {
            if (err?.code === "OFFLINE") setOffline(true);
            setError(err?.message || "Could not record consent.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="homeojob-doctor-detail" data-testid="recording-consent">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-2">Recording consent</h1>
                <p className="text-muted mb-4">
                    Tele recording is allowed only when both you and the doctor accept. Decline still
                    writes an audit row. Never treat a local checkbox as recording allowed.
                </p>

                {!accessToken ? (
                    <p className="text-muted" data-testid="recording-consent-empty-auth">
                        Sign in and open this page from your tele visit (waiting room / appointment link).
                    </p>
                ) : null}

                {accessToken && !teleSessionId ? (
                    <p className="text-muted" data-testid="recording-consent-empty" role="status">
                        No active tele visit on this link. Return to your{" "}
                        <Link to={landingPath("instant-consult")}>instant consult</Link> or waiting
                        room after the clinic starts the session.
                    </p>
                ) : null}

                {accessToken && teleSessionId ? (
                    <div className="homeojob-doctor-detail__card p-4 mb-3">
                        <p className="small text-muted mb-3" data-testid="recording-session-from-link">
                            Consent for your current tele visit (from link).
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={loading}
                                onClick={() => submit(true)}
                                aria-label="Accept recording consent"
                            >
                                {loading ? "Saving…" : "Accept recording"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={loading}
                                onClick={() => submit(false)}
                                aria-label="Decline recording consent"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ) : null}

                {loading ? (
                    <p className="text-muted" data-testid="recording-consent-loading">
                        Saving consent…
                    </p>
                ) : null}

                {offline ? (
                    <p className="text-warning" data-testid="recording-consent-offline">
                        {error || "You appear to be offline."}
                    </p>
                ) : null}

                {error && !offline ? (
                    <p className="text-danger" data-testid="recording-consent-error" role="alert">
                        {error}
                    </p>
                ) : null}

                {result ? (
                    <div className="homeojob-doctor-detail__card p-4" data-testid="recording-consent-result">
                        <p className="mb-1">
                            <strong>Your choice:</strong>{" "}
                            {result.patientAccepted ?? result.PatientAccepted ? "Accepted" : "Declined"}
                        </p>
                        <p className="mb-0">
                            <strong>Recording allowed (API):</strong>{" "}
                            {result.recordAllowed ?? result.RecordAllowed ? "Yes" : "No"}
                        </p>
                    </div>
                ) : null}

                <p className="mt-4 mb-0">
                    <Link to={landingPath("")}>Home</Link>
                </p>
            </Container>
        </section>
    );
};

export default RecordingConsentPage;
