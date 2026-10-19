import React, { useEffect } from "react";
import { Container } from "reactstrap";
import { Link, useNavigate, useParams } from "react-router-dom";

import TeleVideoRoom from "../../../Components/Common/TeleVideoRoom";
import { HiddenLink, navigateHidden, useHiddenSearchParams } from "../../../helpers/hiddenRouteParams";

/**
 * DMO-08.01 / DMO-08.02 — doctor mobile VideoRoom + tele session tokens.
 * Session comes from route after create, or pick a visit from tele queue —
 * never type TeleSessionId.
 */
const DoctorVideoRoomPage = () => {
  const navigate = useNavigate();
  const { sessionId: paramId } = useParams();
  const [searchParams] = useHiddenSearchParams();
  const sessionId = paramId || searchParams.get("sessionId") || "";
  const patientAppId = searchParams.get("patientAppId") || "";

  useEffect(() => {
    document.title = "Video room | Doctor";
  }, []);

  const onSessionCreated = (createdId, appId) => {
    const qs = appId ? `&patientAppId=${encodeURIComponent(appId)}` : "";
    navigateHidden(navigate, `/doctor/mobile/videoroom?sessionId=${encodeURIComponent(createdId)}${qs}`, {
      replace: true,
    });
  };

  return (
    <div
      className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page"
      data-testid="doctor-video-room-page"
    >
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Video room</h2>
            <p className="clinic-page-subtitle mb-0">
              Join consultation using API tele session tokens. Stub vendor — do not invent in-call or paid state.
            </p>
          </div>
          <div className="clinic-table-actions">
            {patientAppId ? (
              <HiddenLink
                className="btn btn-sm btn-soft-primary clinic-action-btn"
                to={`/doctor/mobile/context?patientAppId=${encodeURIComponent(patientAppId)}`}
              >
                <i className="ri-user-heart-line" aria-hidden="true" />
                Patient context
              </HiddenLink>
            ) : null}
            <Link className="btn btn-sm btn-soft-secondary clinic-action-btn" to="/doctordashboard">
              <i className="ri-home-4-line" aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </div>
        <div className="admin-dash-card card">
          <div className="card-body">
            <TeleVideoRoom
              sessionId={sessionId}
              patientAppId={patientAppId}
              onSessionCreated={onSessionCreated}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default DoctorVideoRoomPage;
