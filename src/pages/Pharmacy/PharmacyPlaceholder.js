import React from "react";
import { Card, CardBody, Container } from "reactstrap";
import { pageTitle } from "../../common/brand";

/** FND-02.01 — Pharmacy / HomeoMeds stub only. */
const PharmacyPlaceholder = ({ title = "Pharmacy" }) => {
  document.title = pageTitle(title);
  return (
    <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">{title}</h2>
            <p className="clinic-page-subtitle mb-0">
              Pharmacy / HomeoMeds screens will be built later. Stub only.
            </p>
          </div>
        </div>
        <Card className="admin-dash-card">
          <CardBody>
            <p className="text-muted mb-0">This section is a placeholder until the pharmacy workspace is completed.</p>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default PharmacyPlaceholder;
