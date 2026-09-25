import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    acceptInstantDoctorOffer,
    buildInstantQueueOfferView,
    fetchInstantDoctorOffers,
    loadInstantQueueOfferScreen,
} from "../../../../helpers/publicBookingApi";

/**
 * PAT-25.02 — queue & doctor offer from Phase 8–15 Instant APIs.
 * Patient: queuePosition + OFFERED/NO_DOCTOR from Instant response (no poll URL).
 * Doctor (optional accessToken + role=doctor): list Offers + Accept.
 */
const InstantQueueOfferPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("accessToken") || "";
    const role = (searchParams.get("role") || "patient").toLowerCase();
    const isDoctorView = role === "doctor";

    const [view, setView] = useState(() =>
        buildInstantQueueOfferView(location.state?.instantResult || null)
    );
    const [offers, setOffers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);
    const [acceptingId, setAcceptingId] = useState(null);

    useEffect(() => {
        document.title = `${SITE.name} | Instant queue & offer`;
    }, []);

    useEffect(() => {
        if (location.state?.instantResult) {
            setView(buildInstantQueueOfferView(location.state.instantResult));
        }
    }, [location.state]);

    useEffect(() => {
        if (!isDoctorView || !accessToken) return undefined;
        let cancelled = false;
        setLoading(true);
        setError("");
        fetchInstantDoctorOffers(accessToken)
            .then((rows) => {
                if (!cancelled) {
                    setOffers(rows);
                    setOffline(false);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                if (err?.code === "OFFLINE") {
                    setOffline(true);
                }
                setError(err?.message || "Could not load doctor offers.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isDoctorView, accessToken]);

    const refreshPatientQueue = async () => {
        setError("");
        setOffline(false);
        if (!accessToken) {
            setError("Patient Bearer token required to refresh queue from the Instant API.");
            return;
        }
        setLoading(true);
        try {
            const next = await loadInstantQueueOfferScreen({
                contactName: searchParams.get("contactName") || "Patient",
                contactMobile: searchParams.get("contactMobile") || "7768046064",
                accessToken,
            });
            setView(next);
        } catch (err) {
            if (err?.code === "OFFLINE") setOffline(true);
            setError(err?.message || "Could not load queue & offer.");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        setError("");
        setAcceptingId(requestId);
        try {
            const accepted = await acceptInstantDoctorOffer(requestId, accessToken);
            setOffers((prev) =>
                prev.filter((o) => o.instantConsultRequestId !== requestId)
            );
            setView(
                buildInstantQueueOfferView({
                    instantConsultRequestId: accepted.instantConsultRequestId,
                    status: accepted.status,
                    statusKind: accepted.statusKind,
                    statusLabel: accepted.statusLabel,
                    queuePosition: null,
                    doctorId: null,
                })
            );
        } catch (err) {
            if (err?.code === "OFFLINE") setOffline(true);
            setError(err?.message || "Could not accept offer.");
        } finally {
            setAcceptingId(null);
        }
    };

    return (
        <section className="homeojob-doctor-detail" data-testid="instant-queue-offer">
            <Container className="py-5" style={{ maxWidth: 720 }}>
                <h1 className="h3 mb-2">Queue &amp; doctor offer</h1>
                <p className="text-muted mb-4">
                    Status comes from the Instant API only. There is no patient poll URL — use the
                    queue position and offer fields returned on request (or doctor Offers/Accept).
                </p>

                {loading ? (
                    <p className="text-muted" data-testid="instant-queue-loading">
                        Loading…
                    </p>
                ) : null}

                {offline ? (
                    <p className="text-warning" data-testid="instant-queue-offline">
                        {error}
                    </p>
                ) : null}

                {!loading && error && !offline ? (
                    <p className="text-danger" data-testid="instant-queue-error">
                        {error}
                    </p>
                ) : null}

                {!isDoctorView ? (
                    <>
                        {view.empty && !loading ? (
                            <p className="text-muted" data-testid="instant-queue-empty">
                                No queue yet. Request an instant consult first, or refresh with a
                                patient token.
                            </p>
                        ) : null}

                        {!view.empty ? (
                            <div
                                className="homeojob-doctor-detail__card p-4 mb-3"
                                data-testid="instant-queue-body"
                            >
                                <p className="mb-2">
                                    <strong>Queue position:</strong>{" "}
                                    {view.queuePosition != null ? view.queuePosition : "—"}
                                </p>
                                <p className="mb-2">
                                    <strong>Status:</strong> {view.statusLabel}
                                </p>
                                {view.hasOffer && view.doctorId != null ? (
                                    <p className="mb-0" data-testid="instant-doctor-offer">
                                        <strong>Doctor offer:</strong> A doctor is available
                                        (status from API — not marked paid here)
                                    </p>
                                ) : view.statusKind === "no_doctor" ? (
                                    <p className="mb-0 text-muted">
                                        {view.message || "No doctor is online."}
                                    </p>
                                ) : (
                                    <p className="mb-0 text-muted">No doctor offer on this response.</p>
                                )}
                            </div>
                        ) : null}

                        <div className="mb-3">
                            <button
                                type="button"
                                className="btn btn-primary me-2"
                                onClick={refreshPatientQueue}
                                disabled={loading || !accessToken}
                                aria-label="Refresh queue from Instant API"
                            >
                                Refresh from Instant API
                            </button>
                            <Link
                                className="btn btn-outline-secondary"
                                to={
                                    accessToken
                                        ? `${landingPath("instant-consult")}?accessToken=${encodeURIComponent(accessToken)}`
                                        : landingPath("instant-consult")
                                }
                            >
                                New request
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        {!accessToken ? (
                            <p className="text-muted" data-testid="instant-offers-empty-auth">
                                Pass doctor <code>?accessToken=…&amp;role=doctor</code> to list offers.
                            </p>
                        ) : null}

                        {!loading && accessToken && offers.length === 0 ? (
                            <p className="text-muted" data-testid="instant-offers-empty">
                                No open doctor offers.
                            </p>
                        ) : null}

                        {offers.length > 0 ? (
                            <ul className="list-unstyled" data-testid="instant-offers-list">
                                {offers.map((o) => (
                                    <li
                                        key={o.doctorOfferId || o.instantConsultRequestId}
                                        className="homeojob-doctor-detail__card p-3 mb-2 d-flex justify-content-between align-items-center gap-2"
                                    >
                                        <div>
                                            <strong>#{o.instantConsultRequestId}</strong>{" "}
                                            {o.contactName}
                                            <div className="small text-muted">
                                                Queue {o.queuePosition} · {o.status}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            disabled={acceptingId === o.instantConsultRequestId}
                                            onClick={() => handleAccept(o.instantConsultRequestId)}
                                            aria-label={`Accept offer ${o.instantConsultRequestId}`}
                                        >
                                            {acceptingId === o.instantConsultRequestId
                                                ? "Accepting…"
                                                : "Accept"}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </>
                )}

                <button
                    type="button"
                    className="btn btn-link px-0"
                    onClick={() => navigate(landingPath("book"))}
                >
                    Back to find doctor
                </button>
            </Container>
        </section>
    );
};

export default InstantQueueOfferPage;
