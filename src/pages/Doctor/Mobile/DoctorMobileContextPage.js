import React, { useEffect } from "react";
import { Container } from "reactstrap";
import { useParams } from "react-router-dom";

import PatientContextCard from "../../../Components/Common/PatientContextCard";
import { HiddenLink, useHiddenSearchParams } from "../../../helpers/hiddenRouteParams";

/**
 * DMO-07.02 — doctor mobile patient context card page.
 * Uses GET /api/DoctorMobile/Context/{patientAppId} only — no repertory / case-taking.
 */
const DoctorMobileContextPage = () => {
  const { patientAppId: paramId } = useParams();
  const [searchParams] = useHiddenSearchParams();
  const patientAppId = paramId || searchParams.get("patientAppId") || "";

  useEffect(() => {
    document.title = "Patient context | Homeocentrum";
  }, []);

  return (
    <div
      className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page"
      data-testid="doctor-mobile-context-page"
    >
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title"><i className="ri-user-heart-line" aria-hidden="true" />Patient context</h2>
            <p className="clinic-page-subtitle mb-0">
              Name, age, chief complaint, last visit, payment, and tele status from the Context API.
            </p>
          </div>
          <HiddenLink className="btn btn-sm btn-soft-secondary clinic-action-btn" to="/doctor/mobile/refill">
            <i className="ri-capsule-line" aria-hidden="true" />
            Refill inbox
          </HiddenLink>
        </div>
        <div className="admin-dash-card card">
          <div className="card-body">
            <PatientContextCard patientAppId={patientAppId} />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default DoctorMobileContextPage;
