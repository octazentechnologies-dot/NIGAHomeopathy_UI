import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { loadDeviceCheckScreen } from "../../../../helpers/publicBookingApi";

/**
 * PAT-26.02 — device check via GET /api/Tele/DeviceCheck (anonymous).
 * API returns camera/mic/speaker/connection = "client" — phone checks hardware itself.
 */
const DeviceCheckPage = () => {
    const [payload, setPayload] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);

    const load = () => {
        setLoading(true);
        setError("");
        setOffline(false);
        loadDeviceCheckScreen()
            .then((row) => {
                setPayload(row);
            })
            .catch((err) => {
                if (err?.code === "OFFLINE") {
                    setOffline(true);
                }
                setError(err?.message || "Could not load device check.");
                setPayload(null);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        document.title = `${SITE.name} | Device check`;
        load();
    }, []);

    return (
        <section className="homeojob-doctor-detail" data-testid="device-check">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-2">Device check</h1>
                <p className="text-muted mb-4">
                    Tele readiness from the Phase 8–15 API. This URL does not open the camera — your
                    phone checks camera and microphone itself.
                </p>

                {loading ? (
                    <p className="text-muted" data-testid="device-check-loading">
                        Loading device check…
                    </p>
                ) : null}

                {offline ? (
                    <p className="text-warning" data-testid="device-check-offline">
                        {error}
                    </p>
                ) : null}

                {!loading && error && !offline ? (
                    <p className="text-danger" data-testid="device-check-error">
                        {error}
                    </p>
                ) : null}

                {!loading && !error && !payload ? (
                    <p className="text-muted" data-testid="device-check-empty">
                        No device check data.
                    </p>
                ) : null}

                {payload ? (
                    <div
                        className="homeojob-doctor-detail__card p-4 mb-3"
                        data-testid="device-check-body"
                    >
                        <p className="small text-muted mb-3">
                            Vendor: {payload.vendor}. API values are not a paid or signed state.
                        </p>
                        <ul className="list-unstyled mb-3">
                            {payload.checks.map((c) => (
                                <li key={c.key} className="mb-2" data-testid={`device-check-${c.key}`}>
                                    <strong>{c.label}:</strong> {c.note}{" "}
                                    <span className="text-muted">({c.apiValue})</span>
                                </li>
                            ))}
                        </ul>
                        {payload.localProbes ? (
                            <p className="small mb-2" data-testid="device-check-local">
                                This browser: mediaDevices{" "}
                                {payload.localProbes.mediaDevices ? "available" : "missing"}; network{" "}
                                {payload.localProbes.onLine ? "online" : "offline"}.
                            </p>
                        ) : null}
                        <p className="mb-0 small">{payload.readyHint}</p>
                    </div>
                ) : null}

                <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={load}
                    disabled={loading}
                    aria-label="Retry device check"
                >
                    Retry
                </button>
                <Link className="btn btn-outline-secondary me-2" to={landingPath("instant-consult")}>
                    Instant consult
                </Link>
                <Link className="btn btn-outline-secondary" to={landingPath("book")}>
                    Find a doctor
                </Link>
            </Container>
        </section>
    );
};

export default DeviceCheckPage;
