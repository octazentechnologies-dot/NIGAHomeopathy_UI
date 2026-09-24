import React from "react";
import { Card, CardBody, Container } from "reactstrap";
import AssistedBookWizard from "../../Components/Common/AssistedBookWizard";

/** SUP-07.03 — admin assisted-book wizard (pick doctor + patient + slot). */
const AssistedBookingPage = () => {
  document.title = "Assisted booking | Homeocentrum";
  return (
    <div className="page-content">
      <Container fluid>
        <h4>Assisted booking</h4>
        <p className="text-muted">
          Complete a booking on behalf of a patient who asked for help. Payment stays with Homeocentrum.
        </p>
        <Card>
          <CardBody>
            <AssistedBookWizard allowDoctorPick showRequestQueue />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AssistedBookingPage;
