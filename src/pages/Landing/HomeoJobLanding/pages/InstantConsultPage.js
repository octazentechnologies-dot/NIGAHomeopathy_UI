import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import LandingPageHero from "../components/LandingPageHero";
import {
    getPublicTeleAvailability,
    listPublicDoctors,
    mapPublicDoctorCard,
    requestInstantConsult,
    resolvePublicAccessToken,
    sessionContactDefaults,
} from "../../../../helpers/publicBookingApi";

/**
 * PAT-24.02 — instant consult request via POST /api/Tele/Instant (Bearer).
 * PatientId comes from login JWT on the API — UI must not ask the patient to type it.
 * On success navigates to PAT-25.02 queue & doctor offer screen with API result.
 */
const InstantConsultPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenParam = searchParams.get("accessToken") || "";
    const accessToken = resolvePublicAccessToken(tokenParam);

    const [contactName, setContactName] = useState(() => sessionContactDefaults().name);
    const [contactMobile, setContactMobile] = useState(() => sessionContactDefaults().mobile);
    const [doctorHintId, setDoctorHintId] = useState("");
    const [doctorSearch, setDoctorSearch] = useState("");
    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [selectedDoctorLabel, setSelectedDoctorLabel] = useState("");
    const [availability, setAvailability] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);
    const [availLoading, setAvailLoading] = useState(false);

    useEffect(() => {
        document.title = `${SITE.name} | Instant consult`;
    }, []);

    useEffect(() => {
        let cancelled = false;
        setDoctorsLoading(true);
        const handle = setTimeout(() => {
            listPublicDoctors({
                q: doctorSearch.trim() || undefined,
                teleOnly: true,
                pageNumber: 1,
                pageSize: 20,
            })
                .then((result) => {
                    if (cancelled) return;
                    setDoctors((result.data || []).map((row) => mapPublicDoctorCard(row)));
                })
                .catch(() => {
                    if (!cancelled) setDoctors([]);
                })
                .finally(() => {
                    if (!cancelled) setDoctorsLoading(false);
                });
        }, 280);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [doctorSearch]);

    useEffect(() => {
        const id = Number(doctorHintId);
        if (!id) {
            setAvailability(null);
            return undefined;
        }
        let cancelled = false;
        setAvailLoading(true);
        getPublicTeleAvailability(id)
            .then((row) => {
                if (!cancelled) {
                    setAvailability(row);
                    setOffline(false);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                if (err?.code === "OFFLINE") {
                    setOffline(true);
                    setError(err.message);
                }
                setAvailability(null);
            })
            .finally(() => {
                if (!cancelled) setAvailLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [doctorHintId]);

    const doctorMatches = useMemo(() => {
        const q = doctorSearch.trim().toLowerCase();
        if (!q) return doctors.slice(0, 6);
        return doctors
            .filter((row) => {
                const name = String(row.name || "").toLowerCase();
                const clinic = String(row.clinicName || row.location || "").toLowerCase();
                return name.includes(q) || clinic.includes(q);
            })
            .slice(0, 8);
    }, [doctors, doctorSearch]);

    const selectDoctorHint = (row) => {
        const id = row.id ?? row.doctorId;
        setDoctorHintId(id ? String(id) : "");
        setSelectedDoctorLabel(row.name || "Doctor");
        setDoctorSearch("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setOffline(false);
        if (!accessToken) {
            setError("Sign in as the patient to request an instant consult.");
            return;
        }
        setLoading(true);
        try {
            // PatientId omitted — API resolves from Bearer when linked (do not ask user to type it).
            const row = await requestInstantConsult({
                contactName,
                contactMobile,
                accessToken,
            });
            const query = new URLSearchParams();
            if (row?.instantConsultRequestId) query.set("requestId", String(row.instantConsultRequestId));
            if (tokenParam) query.set("accessToken", tokenParam);
            const qs = query.toString();
            navigate(`${landingPath("instant-consult/queue")}${qs ? `?${qs}` : ""}`, {
                state: { instantResult: row },
                replace: false,
            });
        } catch (err) {
            if (err?.code === "OFFLINE") {
                setOffline(true);
            }
            setError(err?.message || "Could not request instant consult.");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { icon: "ri-chat-heart-line", tone: "blue", title: "Share how to reach you", text: "Name and mobile are enough. Your profile already comes from sign-in." },
        { icon: "ri-user-search-line", tone: "green", title: "We match an online doctor", text: "The request joins the queue and is offered to a doctor who is available now." },
        { icon: "ri-vidicon-line", tone: "purple", title: "Join the video visit", text: "When a doctor accepts, you see the offer and can enter the waiting room." },
    ];

    return (
        <section className="homeojob-page" data-testid="instant-consult">
            <Container>
                <LandingPageHero
                    breadcrumb="Instant consultation"
                    eyebrow="On-demand tele consult"
                    title="Instant"
                    highlight="consultation"
                    subtitle="Request a homeopathic doctor who is online now. After you submit, this page shows your queue position and the doctor offer."
                />

                <Row className="g-4 align-items-start">
                    <Col lg={7}>
                        {!accessToken ? (
                            <div className="homeojob-page__notice" data-testid="instant-consult-empty">
                                <span className="homeojob-page__feature-icon homeojob-page__feature-icon--blue">
                                    <i className="ri-user-line" aria-hidden="true" />
                                </span>
                                <div>
                                    <strong>Sign in to request a consult</strong>
                                    <p>A patient account is required before the request can be sent.</p>
                                    <Link to="/login" className="homeojob-page__cta">
                                        Sign in
                                        <i className="ri-arrow-right-line" aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        ) : null}

                        <form
                            className="homeojob-page__panel homeojob-page__request"
                            onSubmit={handleSubmit}
                            data-testid="instant-consult-form"
                        >
                            <div className="homeojob-page__request-head">
                                <span className="homeojob-page__feature-icon homeojob-page__feature-icon--blue">
                                    <i className="ri-flashlight-fill" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2>Request a consult</h2>
                                    <p>Your profile comes from sign-in. Only name and mobile are needed here.</p>
                                </div>
                            </div>

                            <div className="homeojob-page__field">
                                <label htmlFor="instant-name">Contact name</label>
                                <input
                                    id="instant-name"
                                    className="form-control"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    required
                                    aria-label="Contact name"
                                />
                            </div>
                            <div className="homeojob-page__field">
                                <label htmlFor="instant-mobile">Contact mobile</label>
                                <input
                                    id="instant-mobile"
                                    className="form-control"
                                    value={contactMobile}
                                    onChange={(e) => setContactMobile(e.target.value)}
                                    required
                                    inputMode="tel"
                                    aria-label="Contact mobile"
                                />
                            </div>

                            {loading ? (
                                <p className="homeojob-page__hint" data-testid="instant-consult-loading">
                                    Submitting request…
                                </p>
                            ) : null}
                            {offline ? (
                                <p className="homeojob-page__alert homeojob-page__alert--warn" data-testid="instant-consult-offline">
                                    {error || "You appear to be offline."}
                                </p>
                            ) : null}
                            {error && !offline ? (
                                <p className="homeojob-page__alert" data-testid="instant-consult-error" role="alert">
                                    {error}
                                </p>
                            ) : null}

                            <button
                                type="submit"
                                className="homeojob-page__cta"
                                disabled={loading || !accessToken}
                                aria-label="Request instant consult"
                            >
                                <i className="ri-vidicon-line" aria-hidden="true" />
                                {loading ? "Requesting…" : "Request instant consult"}
                            </button>
                        </form>

                        <div className="homeojob-page__panel homeojob-page__request">
                            <div className="homeojob-page__request-head">
                                <span className="homeojob-page__feature-icon homeojob-page__feature-icon--green">
                                    <i className="ri-stethoscope-line" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2>Check a doctor online</h2>
                                    <p>Optional. Instant match still finds any online doctor when you submit.</p>
                                </div>
                            </div>

                            <div className="homeojob-page__field">
                                <label htmlFor="instant-doctor-search">Search by doctor name or clinic</label>
                                <input
                                    id="instant-doctor-search"
                                    className="form-control"
                                    value={doctorSearch}
                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                    placeholder="Search by doctor name or clinic"
                                    autoComplete="off"
                                    aria-label="Search doctor for availability"
                                    data-testid="instant-doctor-search"
                                />
                            </div>

                            {doctorsLoading ? <p className="homeojob-page__hint">Loading doctors…</p> : null}

                            {doctorMatches.length > 0 ? (
                                <ul className="homeojob-page__doctor-list" data-testid="instant-doctor-matches">
                                    {doctorMatches.map((row) => {
                                        const id = row.id ?? row.doctorId;
                                        const selected = String(id) === String(doctorHintId);
                                        return (
                                            <li key={id}>
                                                <button
                                                    type="button"
                                                    className={`homeojob-page__doctor-pick${selected ? " is-selected" : ""}`}
                                                    onClick={() => selectDoctorHint(row)}
                                                    data-testid={`instant-doctor-${id}`}
                                                >
                                                    <span>
                                                        <strong>{row.name}</strong>
                                                        {row.clinicName ? <em>{row.clinicName}</em> : null}
                                                    </span>
                                                    <i className={selected ? "ri-checkbox-circle-fill" : "ri-arrow-right-s-line"} aria-hidden="true" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : null}

                            {selectedDoctorLabel ? (
                                <p className="homeojob-page__hint" data-testid="instant-doctor-selected">
                                    Checking: <strong>{selectedDoctorLabel}</strong>
                                </p>
                            ) : null}
                            {availLoading ? (
                                <p className="homeojob-page__hint" data-testid="instant-consult-avail-loading">
                                    Checking availability…
                                </p>
                            ) : availability ? (
                                <p
                                    className={`homeojob-page__status${availability.isOnline ? " is-online" : ""}`}
                                    data-testid="instant-consult-availability"
                                >
                                    <i className={availability.isOnline ? "ri-wifi-line" : "ri-wifi-off-line"} aria-hidden="true" />
                                    {selectedDoctorLabel || `Doctor ${availability.doctorId}`} is{" "}
                                    {availability.isOnline ? "online" : "offline"}
                                </p>
                            ) : null}
                        </div>
                    </Col>

                    <Col lg={5}>
                        <aside className="homeojob-page__aside homeojob-page__aside--start">
                            <span className="homeojob-page__aside-icon">
                                <i className="ri-heart-pulse-line" aria-hidden="true" />
                            </span>
                            <p className="homeojob-page__aside-note">Care in three simple steps</p>
                            <ol className="homeojob-page__step-list">
                                {steps.map((step, index) => (
                                    <li key={step.title}>
                                        <span className={`homeojob-page__feature-icon homeojob-page__feature-icon--${step.tone}`}>
                                            <i className={step.icon} aria-hidden="true" />
                                        </span>
                                        <span>
                                            <strong>{index + 1}. {step.title}</strong>
                                            <em>{step.text}</em>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </aside>

                        <div className="homeojob-page__band">
                            <div>
                                <h2>Prefer a scheduled visit?</h2>
                                <p>Browse verified doctors and book an in-clinic or tele slot.</p>
                            </div>
                            <div className="homeojob-page__actions">
                                <Link to={landingPath("find-doctor")} className="homeojob-page__cta">
                                    Find a doctor
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </Link>
                                <Link to={landingPath("")} className="homeojob-page__cta homeojob-page__cta--ghost">
                                    Home
                                </Link>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default InstantConsultPage;
