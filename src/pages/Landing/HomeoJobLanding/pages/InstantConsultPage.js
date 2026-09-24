import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    getPublicTeleAvailability,
    requestInstantConsult,
} from "../../../../helpers/publicBookingApi";

/**
 * PAT-24.02 — instant consult request via POST /api/Tele/Instant (Bearer).
 * On success navigates to PAT-25.02 queue & doctor offer screen with API result.
 */
const InstantConsultPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("accessToken") || "";

    const [contactName, setContactName] = useState("Sanjay Patil");
    const [contactMobile, setContactMobile] = useState("7768046064");
    const [patientId, setPatientId] = useState("");
    const [doctorHintId, setDoctorHintId] = useState("1010");
    const [availability, setAvailability] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);
    const [availLoading, setAvailLoading] = useState(false);

    useEffect(() => {
        document.title = `${SITE.name} | Instant consult`;
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setOffline(false);
        if (!accessToken) {
            setError("Sign in as the patient and pass accessToken to request an instant consult.");
            return;
        }
        setLoading(true);
        try {
            const row = await requestInstantConsult({
                patientId: patientId ? Number(patientId) : undefined,
                contactName,
                contactMobile,
                accessToken,
            });
            // PAT-25.02 — hand off API queue/offer fields only (no local invent).
            navigate(landingPath("instant-consult/queue"), {
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

    return (
        <section className="homeojob-doctor-detail" data-testid="instant-consult">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-2">Instant consult</h1>
                <p className="text-muted mb-4">
                    Request an on-demand tele consult. After submit you see queue position and doctor
                    offer from the API — nothing is marked paid or matched on this device.
                </p>

                {!accessToken ? (
                    <p className="text-muted" data-testid="instant-consult-empty">
                        Add a patient Bearer token as <code>?accessToken=…</code> to submit a request.
                    </p>
                ) : null}

                <div className="homeojob-doctor-detail__card p-4 mb-3">
                    <label className="form-label small mb-1" htmlFor="instant-doctor-hint">
                        Check doctor online (optional)
                    </label>
                    <input
                        id="instant-doctor-hint"
                        className="form-control mb-2"
                        value={doctorHintId}
                        onChange={(e) => setDoctorHintId(e.target.value)}
                        inputMode="numeric"
                        aria-label="Doctor id to check availability"
                    />
                    {availLoading ? (
                        <p className="text-muted small mb-0" data-testid="instant-consult-avail-loading">
                            Checking availability…
                        </p>
                    ) : availability ? (
                        <p className="small mb-0" data-testid="instant-consult-availability">
                            Doctor {availability.doctorId}:{" "}
                            {availability.isOnline ? "online" : "offline"}
                        </p>
                    ) : (
                        <p className="text-muted small mb-0">Availability unknown.</p>
                    )}
                </div>

                <form
                    className="homeojob-doctor-detail__card p-4 mb-3"
                    onSubmit={handleSubmit}
                    data-testid="instant-consult-form"
                >
                    <div className="mb-3">
                        <label className="form-label" htmlFor="instant-name">
                            Contact name
                        </label>
                        <input
                            id="instant-name"
                            className="form-control"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            required
                            aria-label="Contact name"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="instant-mobile">
                            Contact mobile
                        </label>
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
                    <div className="mb-3">
                        <label className="form-label" htmlFor="instant-patient-id">
                            Patient id (optional)
                        </label>
                        <input
                            id="instant-patient-id"
                            className="form-control"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            inputMode="numeric"
                            aria-label="Patient id"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !accessToken}
                        aria-label="Request instant consult"
                    >
                        {loading ? "Requesting…" : "Request instant consult"}
                    </button>
                </form>

                {loading ? (
                    <p className="text-muted" data-testid="instant-consult-loading">
                        Submitting request…
                    </p>
                ) : null}

                {offline ? (
                    <p className="text-warning" data-testid="instant-consult-offline">
                        {error}
                    </p>
                ) : null}

                {!loading && error && !offline ? (
                    <p className="text-danger" data-testid="instant-consult-error">
                        {error}
                    </p>
                ) : null}

                <Link
                    className="btn btn-outline-secondary me-2"
                    to={
                        accessToken
                            ? `${landingPath("instant-consult/queue")}?accessToken=${encodeURIComponent(accessToken)}`
                            : landingPath("instant-consult/queue")
                    }
                >
                    Queue &amp; offer
                </Link>
                <Link className="btn btn-outline-secondary" to={landingPath("book")}>
                    Book a scheduled visit instead
                </Link>
            </Container>
        </section>
    );
};

export default InstantConsultPage;
