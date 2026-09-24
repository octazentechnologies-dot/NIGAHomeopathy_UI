import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    startWaitingRoomPoll,
    WAITING_ROOM_POLL_MS,
} from "../../../../helpers/publicBookingApi";

/**
 * PAT-27.02 — waiting room polls GET /api/Tele/Sessions/{id} until Active.
 * Status only from API — never invent doctor-joined locally.
 */
const WaitingRoomPage = () => {
    const { sessionId: sessionParam } = useParams();
    const [searchParams] = useSearchParams();
    const sessionId = sessionParam || searchParams.get("sessionId") || "";
    const accessToken = searchParams.get("accessToken") || "";

    const [session, setSession] = useState(null);
    const [phase, setPhase] = useState("loading"); // empty | loading | error | offline | ready | auth
    const [error, setError] = useState("");
    const [lastPollAt, setLastPollAt] = useState(null);

    useEffect(() => {
        document.title = `${SITE.name} | Waiting room`;
        if (!sessionId) {
            setPhase("empty");
            setError("Missing tele session id.");
            setSession(null);
            return undefined;
        }
        if (!accessToken) {
            setPhase("auth");
            setError("");
            setSession(null);
            return undefined;
        }

        setPhase("loading");
        setError("");
        const stop = startWaitingRoomPoll(sessionId, accessToken, (row, err) => {
            if (err) {
                if (err?.code === "OFFLINE") {
                    setPhase("offline");
                    setError(err.message);
                } else {
                    setPhase("error");
                    setError(err?.message || "Could not load waiting room.");
                }
                return;
            }
            setSession(row);
            setLastPollAt(new Date());
            setPhase("ready");
            setError("");
        });

        return () => stop();
    }, [sessionId, accessToken]);

    const kind = session?.statusKind ?? "waiting";

    return (
        <section className="homeojob-doctor-detail" data-testid="waiting-room">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-2">Waiting room</h1>
                <p className="text-muted mb-4">
                    Live tele status from the clinic API. Polls every {WAITING_ROOM_POLL_MS / 1000}s
                    until the doctor joins (status Active), then you can request a call token.
                </p>

                {phase === "empty" ? (
                    <p className="text-muted" data-testid="waiting-room-empty" role="status">
                        No session id. Open{" "}
                        <code>/tele/waiting/&#123;sessionId&#125;?accessToken=…</code>.
                    </p>
                ) : null}

                {phase === "auth" ? (
                    <p className="text-warning" data-testid="waiting-room-auth" role="status">
                        Sign in as the patient on this visit (or treating doctor), then open with{" "}
                        <code>accessToken</code>.
                    </p>
                ) : null}

                {phase === "loading" ? (
                    <p
                        className="text-muted"
                        data-testid="waiting-room-loading"
                        role="status"
                        aria-busy="true"
                    >
                        Connecting to waiting room…
                    </p>
                ) : null}

                {phase === "offline" ? (
                    <p className="text-warning" data-testid="waiting-room-offline" role="alert">
                        {error}
                    </p>
                ) : null}

                {phase === "error" ? (
                    <p className="text-danger" data-testid="waiting-room-error" role="alert">
                        {error}
                    </p>
                ) : null}

                {phase === "ready" && session ? (
                    <div
                        className="homeojob-doctor-detail__card p-4 mb-3"
                        data-testid="waiting-room-body"
                        aria-live="polite"
                    >
                        <p className="mb-2">
                            <strong>Session #</strong>
                            {session.teleSessionId}
                        </p>
                        <p className="mb-2">
                            <strong>Visit #</strong>
                            {session.patientAppId}
                        </p>
                        <p className="mb-2">
                            <strong>Room:</strong> {session.roomId}
                        </p>
                        <p className="mb-2">
                            <strong>Status:</strong>{" "}
                            <span
                                className={
                                    kind === "active"
                                        ? "text-success"
                                        : kind === "ended"
                                          ? "text-muted"
                                          : "text-warning"
                                }
                                data-testid="waiting-room-status"
                            >
                                {session.statusLabel}
                            </span>{" "}
                            <span className="text-muted">({session.status})</span>
                        </p>
                        <p className="mb-2 small text-muted">
                            Recording allowed: {session.recordAllowed ? "yes" : "no"} (from API only)
                        </p>
                        {lastPollAt ? (
                            <p className="mb-0 small text-muted">
                                Last update {lastPollAt.toLocaleTimeString()}
                            </p>
                        ) : null}
                        {kind === "active" ? (
                            <p className="mt-3 mb-0 text-success" data-testid="waiting-room-ready">
                                Doctor has joined. Next step is Token (PAT-28) — not invented on this
                                device.
                            </p>
                        ) : null}
                        {kind === "waiting" ? (
                            <p className="mt-3 mb-0 text-muted" data-testid="waiting-room-waiting">
                                Still waiting. Status will change to Active when the doctor starts the
                                session.
                            </p>
                        ) : null}
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

export default WaitingRoomPage;
