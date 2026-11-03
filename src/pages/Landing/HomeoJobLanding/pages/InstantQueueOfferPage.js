import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import LandingPageHero from "../components/LandingPageHero";
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
            if (accepted.teleSessionId) {
                const visit = accepted.patientAppId
                    ? `&patientAppId=${encodeURIComponent(accepted.patientAppId)}`
                    : "";
                navigate(
                    `/doctor/mobile/videoroom?sessionId=${encodeURIComponent(accepted.teleSessionId)}${visit}`
                );
                return;
            }
            setView(
                buildInstantQueueOfferView({
                    instantConsultRequestId: accepted.instantConsultRequestId,
                    status: accepted.status,
                    statusKind: accepted.statusKind,
                    statusLabel: accepted.statusLabel,
                    queuePosition: null,
                    doctorId: null,
                    patientAppId: accepted.patientAppId,
                    teleSessionId: accepted.teleSessionId,
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

    const waitingRoomPath = view.teleSessionId
        ? `${landingPath("tele/waiting", view.teleSessionId)}${
              searchParams.get("accessToken")
                  ? `?accessToken=${encodeURIComponent(searchParams.get("accessToken"))}`
                  : ""
          }`
        : "";

    return (
        <section className="homeojob-page" data-testid="instant-queue-offer">
            <Container>
                <LandingPageHero
                    breadcrumb="Instant consultation"
                    eyebrow="Queue and offer"
                    title="Your"
                    highlight="consult"
                    align="start"
                    subtitle={
                        isDoctorView
                            ? "Open instant requests offered to you."
                            : "This page checks your request every few seconds until a doctor accepts."
                    }
                />

                <div className="homeojob-page__panel homeojob-page__request homeojob-page__queue">
                    {loading ? (
                        <p className="homeojob-page__hint" data-testid="instant-queue-loading">
                            Loading…
                        </p>
                    ) : null}

                    {offline ? (
                        <p className="homeojob-page__alert homeojob-page__alert--warn" data-testid="instant-queue-offline">
                            {error}
                        </p>
                    ) : null}

                    {!loading && error && !offline ? (
                        <p className="homeojob-page__alert" data-testid="instant-queue-error" role="alert">
                            {error}
                        </p>
                    ) : null}

                    {!isDoctorView ? (
                        <>
                            {!accessToken ? (
                                <div className="homeojob-page__notice" data-testid="instant-queue-auth">
                                    <span className="homeojob-page__feature-icon homeojob-page__feature-icon--blue">
                                        <i className="ri-user-line" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <strong>Sign in to follow this request</strong>
                                        <p>Use the same patient account that submitted the consult.</p>
                                        <Link to="/login" className="homeojob-page__cta">
                                            Sign in
                                        </Link>
                                    </div>
                                </div>
                            ) : null}

                            {view.empty && !loading && !requestId ? (
                                <p className="homeojob-page__empty" data-testid="instant-queue-empty">
                                    No queue yet. Request an instant consult first.
                                </p>
                            ) : null}

                            {!view.empty ? (
                                <div data-testid="instant-queue-body">
                                    <p className="homeojob-page__hint">Request #{view.instantConsultRequestId}</p>
                                    <div className="homeojob-page__queue-stats">
                                        {waiting ? (
                                            <article>
                                                <span>Queue position</span>
                                                <strong>{view.queuePosition != null ? view.queuePosition : "—"}</strong>
                                            </article>
                                        ) : null}
                                        <article>
                                            <span>Status</span>
                                            <strong>{view.statusLabel}</strong>
                                        </article>
                                    </div>
                                    {view.hasOffer && view.doctorId != null ? (
                                        <p className="homeojob-page__status is-online" data-testid="instant-doctor-offer">
                                            <i className="ri-stethoscope-line" aria-hidden="true" />
                                            {view.doctorName || `Doctor #${view.doctorId}`}
                                            {accepted ? " accepted your request." : " has been offered your request."}
                                        </p>
                                    ) : view.statusKind === "no_doctor" ? (
                                        <p className="homeojob-page__hint">
                                            No doctor is online right now. We keep checking and offer your request as soon as one comes online.
                                        </p>
                                    ) : null}
                                    {waitingRoomPath ? (
                                        <p className="homeojob-page__actions">
                                            <Link className="homeojob-page__cta" to={waitingRoomPath} data-testid="instant-join-waiting">
                                                Join waiting room
                                                <i className="ri-arrow-right-line" aria-hidden="true" />
                                            </Link>
                                        </p>
                                    ) : null}
                                    {waiting && lastChecked ? (
                                        <p className="homeojob-page__hint" data-testid="instant-last-checked">
                                            Last checked {lastChecked.toLocaleTimeString()}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="homeojob-page__actions">
                                <button
                                    type="button"
                                    className="homeojob-page__cta"
                                    onClick={() => refreshPatientQueue()}
                                    disabled={loading || !accessToken || !requestId}
                                    aria-label="Check status now"
                                >
                                    Check now
                                </button>
                                {view.canCancel && waiting ? (
                                    <button
                                        type="button"
                                        className="homeojob-page__cta homeojob-page__cta--danger"
                                        onClick={handleCancel}
                                        disabled={cancelling || !accessToken}
                                        data-testid="instant-cancel"
                                    >
                                        {cancelling ? "Cancelling…" : "Cancel request"}
                                    </button>
                                ) : null}
                                {!waiting ? (
                                    <Link className="homeojob-page__cta homeojob-page__cta--ghost" to={newRequestPath}>
                                        New request
                                    </Link>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <>
                            {!accessToken ? (
                                <div className="homeojob-page__notice" data-testid="instant-offers-empty-auth">
                                    <span className="homeojob-page__feature-icon homeojob-page__feature-icon--blue">
                                        <i className="ri-user-line" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <strong>Sign in as a doctor</strong>
                                        <p>Doctor sign-in is required to list open offers.</p>
                                        <Link to="/login" className="homeojob-page__cta">
                                            Sign in
                                        </Link>
                                    </div>
                                </div>
                            ) : null}

                            {!loading && accessToken && offers.length === 0 ? (
                                <p className="homeojob-page__empty" data-testid="instant-offers-empty">
                                    No open doctor offers.
                                </p>
                            ) : null}

                            {offers.length > 0 ? (
                                <ul className="homeojob-page__offer-list" data-testid="instant-offers-list">
                                    {offers.map((o) => (
                                        <li key={o.doctorOfferId || o.instantConsultRequestId}>
                                            <div>
                                                <strong>#{o.instantConsultRequestId}</strong>
                                                <em>{o.contactName}</em>
                                                <span>
                                                    Queue {o.queuePosition} · {o.status}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="homeojob-page__cta"
                                                disabled={acceptingId === o.instantConsultRequestId}
                                                onClick={() => handleAccept(o.instantConsultRequestId)}
                                                aria-label={`Accept offer ${o.instantConsultRequestId}`}
                                            >
                                                {acceptingId === o.instantConsultRequestId ? "Accepting…" : "Accept"}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </>
                    )}

                    <button type="button" className="homeojob-page__text-link" onClick={() => navigate(landingPath("book"))}>
                        Back to find a doctor
                    </button>
                </div>
            </Container>
        </section>
    );
};

export default InstantQueueOfferPage;
