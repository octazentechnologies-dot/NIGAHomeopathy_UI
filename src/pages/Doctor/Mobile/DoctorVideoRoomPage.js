import React, { useEffect } from "react";
import { Container } from "reactstrap";
import { Link, useParams, useSearchParams } from "react-router-dom";

import TeleVideoRoom from "../../../Components/Common/TeleVideoRoom";

/**
 * DMO-08.01 / DMO-08.02 — doctor mobile VideoRoom + tele session tokens.
 * POST /api/Tele/Sessions/{id}/Token and /Rejoin (TEL-04.01 — web + mobile same JSON).
 */
const DoctorVideoRoomPage = () => {
  const { sessionId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = paramId || searchParams.get("sessionId") || "";
  const patientAppId = searchParams.get("patientAppId") || "";

  useEffect(() => {
    document.title = "Video room | Doctor";
  }, []);

  return (
    <div className="page-content" data-testid="doctor-video-room-page">
      <Container fluid className="py-4" style={{ maxWidth: 560 }}>
        <h4 className="mb-2">Video room</h4>
        <p className="text-muted small mb-3">
          Join consultation from the phone using New-API tele session tokens. Stub vendor — do not
          invent in-call or paid state on the device.
        </p>
        <TeleVideoRoom sessionId={sessionId} />
        <div className="mt-3">
          {patientAppId ? (
            <Link
              className="btn btn-outline-secondary btn-sm me-2"
              to={`/doctor/mobile/context/${encodeURIComponent(patientAppId)}`}
            >
              Patient context
            </Link>
          ) : null}
          <Link className="btn btn-link btn-sm" to="/doctordashboard">
            Dashboard
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default DoctorVideoRoomPage;
