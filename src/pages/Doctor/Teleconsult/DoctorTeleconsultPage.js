import React from "react";
import { Container } from "reactstrap";

/**
 * Doctor Teleconsult menu (/doctor/tele). A blank page so the menu does not
 * fall through to the catch-all route and sign the doctor out.
 */
const DoctorTeleconsultPage = () => {
  document.title = "Teleconsult | Niga Homeocentrum";

  return (
    <div className="page-content doctor-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title mb-1">Teleconsult</h2>
        <p className="text-muted mb-0">Teleconsult queue will be listed on this page.</p>
      </Container>
    </div>
  );
};

export default DoctorTeleconsultPage;
