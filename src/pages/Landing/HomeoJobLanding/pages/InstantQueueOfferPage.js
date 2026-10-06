import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    acceptInstantDoctorOffer,
    buildInstantQueueOfferView,
    cancelInstantConsult,
    fetchInstantDoctorOffers,
    getInstantConsultStatus,
    isInstantConsultWaiting,
    resolvePublicAccessToken,
} from "../../../../helpers/publicBookingApi";

const POLL_MS = 5000;

/**
 * PAT-25.02 — queue & doctor offer from Phase 8–15 Instant APIs.
 * Patient: polls GET /api/Tele/Instant/{id} while waiting; can cancel before a doctor accepts.
 * Doctor (role=doctor): list Offers + Accept.
 */
const InstantQueueOfferPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const accessToken = resolvePublicAccessToken(searchParams.get("accessToken"));
    const role = (searchParams.get("role") || "patient").toLowerCase();
    const isDoctorView = role === "doctor";

    const initialResult = location.state?.instantResult || null;
    const [view, setView] = useState(() => buildInstantQueueOfferView(initialResult));
    const requestId =
        view.instantConsultRequestId ||
        Number(searchParams.get("requestId")) ||
        null;

    const [offers, setOffers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);
    const [acceptingId, setAcceptingId] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);
    const pollingRef = useRef(false);

    useEffect(() => {
        document.title = `${SITE.name} | Instant queue & offer`;
    }, []);

    useEffect(() => {
        if (location.state?.instantResult) {
            setView(buildInstantQueueOfferView(location.state.instantResult));
        }
    }, [location.state]);

    const refreshPatientQueue = useCallback(
        async ({ quiet = false } = {}) => {
            if (!requestId) {
                if (!quiet) setError("No instant request yet. Start a new request first.");
                return;
            }
            if (!accessToken) {
                if (!quiet) setError("Sign in as the patient to see this request.");
                return;
            }
            if (pollingRef.current) return;
            pollingRef.current = true;
            if (!quiet) setLoading(true);
            try {
                const next = await getInstantConsultStatus(requestId, accessToken);
                setView(next);
                setError("");
                setOffline(false);
                setLastChecked(new Date());
            } catch (err) {
                if (err?.code === "OFFLINE") setOffline(true);
                setError(err?.message || "Could not load queue & offer.");
            } finally {
                pollingRef.current = false;
                if (!quiet) setLoading(false);
            }
        },
        [requestId, accessToken]
    );

    useEffect(() => {
        if (isDoctorView || !requestId || !accessToken) return undefined;
        if (!view.empty && !isInstantConsultWaiting(view.status)) return undefined;
        if (view.empty) refreshPatientQueue();
        const timer = setInterval(() => refreshPatientQueue({ quiet: true }), POLL_MS);
        return () => clearInterval(timer);
    }, [isDoctorView, requestId, accessToken, view.empty, view.status, refreshPatientQueue]);

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

    const handleCancel = async () => {
        if (!requestId || cancelling) return;
        if (!window.confirm("Cancel this instant consult request?")) return;
        setError("");
        setCancelling(true);
        try {
            await cancelInstantConsult(requestId, accessToken);
            await refreshPatientQueue();
        } catch (err) {
            if (err?.code === "OFFLINE") setOffline(true);
            setError(err?.message || "Could not cancel the request.");
        } finally {
            setCancelling(false);
        }
    };

    const handleAccept = async (offerRequestId) => {
        setError("");
        setAcceptingId(offerRequestId);
        try {
            const accepted = await acceptInstantDoctorOffer(offerRequestId, accessToken);
            setOffers((prev) =>
                prev.filter((o) => o.instantConsultRequestId !== offerRequestId)
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

    const waiting = !view.empty && isInstantConsultWaiting(view.status);
    const accepted = String(view.status || "").toUpperCase() === "ACCEPTED";
    const newRequestPath = searchParams.get("accessToken")
        ? `${landingPath("instant-consult")}?accessToken=${encodeURIComponent(searchParams.get("accessToken"))}`
        : landingPath("instant-consult");

    return (
        <section className="homeojob-doctor-detail" data-testid="instant-queue-offer">
            <Container className="py-5" style={{ maxWidth: 720 }}>
                <h1 className="h3 mb-2">Queue &amp; doctor offer</h1>
                <p className="text-muted mb-4">
                    {isDoctorView
                        ? "Open instant requests offered to you."
                        : "This page checks your request every few seconds until a doctor accepts."}
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
                    <p className="text-danger" data-testid="instant-queue-error" role="alert">
                        {error}
                    </p>
                ) : null}

                {!isDoctorView ? (
                    <>
                        {!accessToken ? (
                            <p className="text-muted" data-testid="instant-queue-auth">
                                <Link to="/login">Sign in</Link> as the patient to follow this request.
                            </p>
                        ) : null}

                        {view.empty && !loading && !requestId ? (
                            <p className="text-muted" data-testid="instant-queue-empty">
                                No queue yet. Request an instant consult first.
                            </p>
                        ) : null}

                        {!view.empty ? (
                            <div
                                className="homeojob-doctor-detail__card p-4 mb-3"
                                data-testid="instant-queue-body"
                            >
                                <p className="mb-2 small text-muted">
                                    Request #{view.instantConsultRequestId}
                                </p>
                                {waiting ? (
                                    <p className="mb-2">
                                        <strong>Queue position:</strong>{" "}
                                        {view.queuePosition != null ? view.queuePosition : "—"}
                                    </p>
                                ) : null}
                                <p className="mb-2">
                                    <strong>Status:</strong> {view.statusLabel}
                                </p>
                                {view.hasOffer && view.doctorId != null ? (
                                    <p className="mb-0" data-testid="instant-doctor-offer">
                                        <strong>Doctor:</strong>{" "}
                                        {view.doctorName || `Doctor #${view.doctorId}`}
                                        {accepted
                                            ? " accepted your request."
                                            : " has been offered your request."}
                                    </p>
                                ) : view.statusKind === "no_doctor" ? (
                                    <p className="mb-0 text-muted">
                                        No doctor is online right now. We keep checking and offer your
                                        request as soon as one comes online.
                                    </p>
                                ) : null}
                                {waiting && lastChecked ? (
                                    <p className="mb-0 mt-2 small text-muted" data-testid="instant-last-checked">
                                        Last checked {lastChecked.toLocaleTimeString()}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="mb-3 d-flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => refreshPatientQueue()}
                                disabled={loading || !accessToken || !requestId}
                                aria-label="Check status now"
                            >
                                Check now
                            </button>
                            {view.canCancel && waiting ? (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleCancel}
                                    disabled={cancelling || !accessToken}
                                    data-testid="instant-cancel"
                                >
                                    {cancelling ? "Cancelling…" : "Cancel request"}
                                </button>
                            ) : null}
                            {!waiting ? (
                                <Link className="btn btn-outline-secondary" to={newRequestPath}>
                                    New request
                                </Link>
                            ) : null}
                        </div>
                    </>
                ) : (
                    <>
                        {!accessToken ? (
                            <p className="text-muted" data-testid="instant-offers-empty-auth">
                                <Link to="/login">Sign in</Link> as a doctor to list offers.
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
                                            <strong>{o.instantConsultRequestId}</strong>{" "}
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
