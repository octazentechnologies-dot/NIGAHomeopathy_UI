import React from "react";
import { Container } from "reactstrap";
import { useParams, useSearchParams } from "react-router-dom";

import PatientContextCard from "../../../Components/Common/PatientContextCard";

/**
 * DMO-07.02 — doctor mobile patient context card page.
 * Uses GET /api/DoctorMobile/Context/{patientAppId} only — no repertory / case-taking.
 */
const DoctorMobileContextPage = () => {
  const { patientAppId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const patientAppId = paramId || searchParams.get("patientAppId") || "";

  return (
    <div className="page-content" data-testid="doctor-mobile-context-page">
      <Container fluid className="py-4" style={{ maxWidth: 560 }}>
        <h4 className="mb-3">Patient context</h4>
        <p className="text-muted small mb-3">
          Name, age, chief complaint, last visit, payment, and tele status from the Context API.
          Case-taking tabs are not shipped here.
        </p>
        <PatientContextCard patientAppId={patientAppId} />
      </Container>
    </div>
  );
};

export default DoctorMobileContextPage;
