import React from "react";
import { Card, CardBody, Container } from "reactstrap";
import AssistedBookWizard from "../../Components/Common/AssistedBookWizard";

/** SUP-07.03 — admin assisted-book wizard (pick doctor + patient + slot). */
const AssistedBookingPage = () => {
  document.title = "Assisted booking | Homeocentrum";
  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Assisted booking</h2>
        <p className="clinic-page-subtitle">
          Complete a booking on behalf of a patient who asked for help. Payment stays with Homeocentrum.
        </p>
        <Card className="admin-dash-card">
          <CardBody>
            <AssistedBookWizard allowDoctorPick showRequestQueue />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AssistedBookingPage;
