import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    getPublicDoctor,
    getPublicDoctorSlots,
    mapPublicDoctorCard,
    toIsoDate,
} from "../../../../helpers/publicBookingApi";
import WaitlistJoinPanel from "../components/WaitlistJoinPanel";

const formatBookingDate = (date) => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} (${weekdays[date.getDay()]})`;
};

const BookSlotsPage = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [doctor, setDoctor] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [consultMode, setConsultMode] = useState(searchParams.get("mode") === "tele" ? "tele" : "clinic");
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [bookingDate, setBookingDate] = useState(() => {
        const fromQuery = searchParams.get("date");
        const d = fromQuery ? new Date(`${fromQuery}T00:00:00`) : new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const skipSlotLoadingFlash = useRef(false);

    useEffect(() => {
        document.title = `${SITE.name} | Book slots`;
        let cancelled = false;
        getPublicDoctor(doctorId)
            .then((row) => {
                if (!cancelled) setDoctor(mapPublicDoctorCard(row));
            })
            .catch(() => {
                if (!cancelled) setLoadError("Doctor not found or not verified for directory.");
            });
        return () => {
            cancelled = true;
        };
    }, [doctorId]);

    useEffect(() => {
        const id = Number(doctorId);
        if (!Number.isFinite(id) || id <= 0) return undefined;
        let cancelled = false;
        if (!skipSlotLoadingFlash.current) setSlotsLoading(true);
        skipSlotLoadingFlash.current = false;
        const load = async () => {
            const start = new Date(bookingDate);
            start.setHours(0, 0, 0, 0);
            let found = false;
            for (let offset = 0; offset < 14; offset += 1) {
                const day = new Date(start);
                day.setDate(start.getDate() + offset);
                try {
                    const payload = await getPublicDoctorSlots(id, day);
                    if (cancelled) return;
                    const nested = payload?.data ?? payload?.Data ?? payload;
                    const list = (nested.slots || nested.Slots || payload.slots || payload.Slots || []).filter((slot) => {
                        const status = String(slot.status || slot.Status || "available").toLowerCase();
                        return status === "available";
                    });
                    if (list.length) {
                        found = true;
                        if (offset > 0) {
                            skipSlotLoadingFlash.current = true;
                            setBookingDate(day);
                        }
                        setSlots(list);
                        setSelectedSlot((prev) => {
                            if (prev && list.some((slot) => (slot.time || slot.label) === prev)) return prev;
                            return list[0]?.time || list[0]?.label || "";
                        });
                        break;
                    }
                } catch {
                    if (cancelled) return;
                }
            }
            if (!cancelled && !found) {
                setSlots([]);
                setSelectedSlot("");
            }
            if (!cancelled) setSlotsLoading(false);
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [doctorId, bookingDate]);

    const continueToConfirm = () => {
        if (!selectedSlot || !doctor?.id) return;
        const params = new URLSearchParams({
            date: toIsoDate(bookingDate),
            slot: selectedSlot,
            mode: consultMode,
        });
        navigate(`${landingPath(`book/${doctor.id}/confirm`)}?${params.toString()}`);
    };

    if (loadError) {
        return (
            <section className="homeojob-doctor-detail">
                <Container>
                    <p className="text-danger py-5">{loadError}</p>
                    <Link to={landingPath("book")}>Back to book a doctor</Link>
                </Container>
            </section>
        );
    }

    if (!doctor) {
        return (
            <section className="homeojob-doctor-detail">
                <Container>
                    <p className="text-muted py-5">Loading slots…</p>
                </Container>
            </section>
        );
    }

    const dateValue = toIsoDate(bookingDate);

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-4">
                <nav className="homeojob-doctor-detail__breadcrumb" aria-label="Breadcrumb">
                    <Link to={landingPath()}>Home</Link>
                    <span aria-hidden="true">&gt;</span>
                    <Link to={landingPath("book")}>Book</Link>
                    <span aria-hidden="true">&gt;</span>
                    <Link to={landingPath(`book/${doctor.id}`)}>{doctor.name}</Link>
                    <span aria-hidden="true">&gt;</span>
                    <span>Slots</span>
                </nav>
                <Row className="justify-content-center">
                    <Col lg={6}>
                        <div className="homeojob-doctor-detail__card homeojob-doctor-detail__booking">
                            <div className="homeojob-doctor-detail__booking-head">
                                <i className="ri-calendar-check-line" aria-hidden="true" />
                                <div>
                                    <h2>Choose a slot with {doctor.name}</h2>
                                    <p>In-clinic ₹ {doctor.inClinic} · Tele ₹ {doctor.tele}</p>
                                </div>
                            </div>
                            <div className="homeojob-doctor-detail__mode">
                                <button
                                    type="button"
                                    className={consultMode === "clinic" ? "is-active" : undefined}
                                    onClick={() => setConsultMode("clinic")}
                                >
                                    In-Clinic | ₹ {doctor.inClinic}
                                </button>
                                <button
                                    type="button"
                                    className={consultMode === "tele" ? "is-active" : undefined}
                                    onClick={() => setConsultMode("tele")}
                                >
                                    Tele Consultation | ₹ {doctor.tele}
                                </button>
                            </div>
                            <label className="homeojob-doctor-detail__date">
                                <i className="ri-calendar-line" aria-hidden="true" />
                                <input
                                    type="date"
                                    min={toIsoDate(new Date())}
                                    value={dateValue}
                                    onChange={(e) => {
                                        const next = e.target.value ? new Date(`${e.target.value}T00:00:00`) : new Date();
                                        next.setHours(0, 0, 0, 0);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        if (next < today) return;
                                        setBookingDate(next);
                                    }}
                                    aria-label="Appointment date"
                                />
                            </label>
                            <p className="text-muted small mb-2">
                                {formatBookingDate(bookingDate)} — only this doctor&apos;s open schedule times.
                            </p>
                            <div className="homeojob-doctor-detail__slots">
                                <h3>Available Slots</h3>
                                <div className="homeojob-doctor-detail__slot-grid">
                                    {slotsLoading ? (
                                        <p className="text-muted small mb-0">Loading slots…</p>
                                    ) : slots.length === 0 ? (
                                        <p className="text-muted small mb-0">No open slots for this date.</p>
                                    ) : (
                                        slots.map((slot) => {
                                            const value = slot.time || slot.label;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    className={selectedSlot === value ? "is-active" : undefined}
                                                    onClick={() => setSelectedSlot(value)}
                                                >
                                                    {slot.label || value}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            {!slotsLoading && slots.length === 0 ? (
                                <WaitlistJoinPanel
                                    doctorId={doctor.id}
                                    requestedDate={bookingDate}
                                    consultMode={consultMode}
                                />
                            ) : null}
                            <button
                                type="button"
                                className="homeojob-doctor-detail__book"
                                onClick={continueToConfirm}
                                disabled={slotsLoading || !selectedSlot}
                            >
                                Continue to confirm
                                <i className="ri-arrow-right-line" aria-hidden="true" />
                            </button>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default BookSlotsPage;
