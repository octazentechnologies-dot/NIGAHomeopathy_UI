import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    getPublicTeleAvailability,
    listPublicDoctors,
    mapPublicDoctorCard,
    requestInstantConsult,
} from "../../../../helpers/publicBookingApi";

/**
 * PAT-24.02 — instant consult request via POST /api/Tele/Instant (Bearer).
 * PatientId comes from login JWT on the API — UI must not ask the patient to type it.
 * On success navigates to PAT-25.02 queue & doctor offer screen with API result.
 */
const InstantConsultPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const accessToken = searchParams.get("accessToken") || "";

    const [contactName, setContactName] = useState("Sanjay Patil");
    const [contactMobile, setContactMobile] = useState("7768046064");
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
            setError("Sign in as the patient and pass accessToken to request an instant consult.");
            return;
        }
        setLoading(true);
        try {
            // PatientId omitted — New-API resolves from Bearer when linked (do not ask user to type it).
            const row = await requestInstantConsult({
                contactName,
                contactMobile,
                accessToken,
            });
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
                    <label className="form-label small mb-1" htmlFor="instant-doctor-search">
                        Check a doctor online (optional)
                    </label>
                    <input
                        id="instant-doctor-search"
                        className="form-control mb-2"
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        placeholder="Search by doctor name or clinic"
                        autoComplete="off"
                        aria-label="Search doctor for availability"
                        data-testid="instant-doctor-search"
                    />
                    {doctorsLoading ? (
                        <p className="text-muted small mb-2">Loading doctors…</p>
                    ) : null}
                    {doctorMatches.length > 0 ? (
                        <ul className="list-unstyled mb-2" data-testid="instant-doctor-matches">
                            {doctorMatches.map((row) => {
                                const id = row.id ?? row.doctorId;
                                return (
                                    <li key={id} className="mb-1">
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm p-0"
                                            onClick={() => selectDoctorHint(row)}
                                            data-testid={`instant-doctor-${id}`}
                                        >
                                            {row.name}
                                            {row.clinicName ? ` · ${row.clinicName}` : ""}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : null}
                    {selectedDoctorLabel ? (
                        <p className="small mb-1" data-testid="instant-doctor-selected">
                            Checking: <strong>{selectedDoctorLabel}</strong>
                        </p>
                    ) : null}
                    {availLoading ? (
                        <p className="text-muted small mb-0" data-testid="instant-consult-avail-loading">
                            Checking availability…
                        </p>
                    ) : availability ? (
                        <p className="small mb-0" data-testid="instant-consult-availability">
                            {selectedDoctorLabel || `Doctor ${availability.doctorId}`}:{" "}
                            {availability.isOnline ? "online" : "offline"}
                        </p>
                    ) : (
                        <p className="text-muted small mb-0">
                            Optional — instant match still finds any online doctor when you submit.
                        </p>
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
                    <p className="text-muted small mb-3">
                        Your profile comes from sign-in — only name and mobile are needed here.
                    </p>
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
                        {error || "You appear to be offline."}
                    </p>
                ) : null}

                {error && !offline ? (
                    <p className="text-danger" data-testid="instant-consult-error" role="alert">
                        {error}
                    </p>
                ) : null}

                <p className="mt-4 mb-0">
                    <Link to={landingPath("find-doctor")}>Find a doctor</Link>
                    {" · "}
                    <Link to={landingPath("")}>Home</Link>
                </p>
            </Container>
        </section>
    );
};

export default InstantConsultPage;
