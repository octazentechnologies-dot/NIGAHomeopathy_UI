import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { postTeleRecordingConsent } from "../../../../helpers/publicBookingApi";

/**
 * PAT-29.02 — recording consent via POST /api/Tele/Consent (Bearer).
 * recordAllowed is true only when both doctor and patient accepted — from API only.
 */
const RecordingConsentPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const accessToken = searchParams.get("accessToken") || "";
    const sessionFromUrl = searchParams.get("teleSessionId") || "";

    const [teleSessionId, setTeleSessionId] = useState(sessionFromUrl);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        document.title = `${SITE.name} | Recording consent`;
    }, []);

    useEffect(() => {
        if (sessionFromUrl) setTeleSessionId(sessionFromUrl);
    }, [sessionFromUrl]);

    const submit = async (accepted) => {
        setError("");
        setResult(null);
        setOffline(false);
        if (!teleSessionId) {
            setError("Enter a tele session id.");
            return;
        }
        if (!accessToken) {
            setError("Sign in and pass accessToken to record consent.");
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
                        Add <code>?accessToken=…&amp;teleSessionId=…</code> to submit consent.
                    </p>
                ) : null}

                {!teleSessionId && accessToken ? (
                    <p className="text-muted" data-testid="recording-consent-empty">
                        Enter a tele session id from an active visit.
                    </p>
                ) : null}

                <div className="homeojob-doctor-detail__card p-4 mb-3">
                    <label className="form-label" htmlFor="recording-session-id">
                        Tele session id
                    </label>
                    <input
                        id="recording-session-id"
                        className="form-control mb-3"
                        value={teleSessionId}
                        onChange={(e) => setTeleSessionId(e.target.value)}
                        inputMode="numeric"
                        aria-label="Tele session id"
                    />
                    <div className="d-flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={loading || !accessToken || !teleSessionId}
                            onClick={() => submit(true)}
                            aria-label="Accept recording consent"
                        >
                            {loading ? "Saving…" : "Accept recording"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            disabled={loading || !accessToken || !teleSessionId}
                            onClick={() => submit(false)}
                            aria-label="Decline recording consent"
                        >
                            Decline
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-muted" data-testid="recording-consent-loading">
                        Saving consent…
                    </p>
                ) : null}

                {offline ? (
                    <p className="text-warning" data-testid="recording-consent-offline">
                        {error}
                    </p>
                ) : null}

                {!loading && error && !offline ? (
                    <p className="text-danger" data-testid="recording-consent-error">
                        {error}
                    </p>
                ) : null}

                {result ? (
                    <div
                        className="homeojob-doctor-detail__card p-4 mb-3"
                        data-testid="recording-consent-result"
                    >
                        <p className="mb-2">
                            <strong>Session:</strong> {result.teleSessionId}
                        </p>
                        <p className="mb-2">
                            <strong>Your choice:</strong>{" "}
                            {result.accepted ? "Accepted" : "Declined"}
                            {result.byRole ? (
                                <span className="text-muted"> ({result.byRole})</span>
                            ) : null}
                        </p>
                        <p className="mb-0">
                            <strong>Recording allowed:</strong>{" "}
                            {result.recordAllowed ? "Yes" : "No"} — {result.recordAllowedLabel}
                        </p>
                    </div>
                ) : null}

                <Link className="btn btn-outline-secondary me-2" to={landingPath("device-check")}>
                    Device check
                </Link>
                <Link className="btn btn-outline-secondary" to={landingPath("book")}>
                    Find a doctor
                </Link>
            </Container>
        </section>
    );
};

export default RecordingConsentPage;
