import React from "react";
import { Card, CardBody, Container } from "reactstrap";
import { pageTitle } from "../../common/brand";

/** FND-02.01 — Account portal stub only (M08 builds real screens). */
const AccountPlaceholder = ({ title = "Account" }) => {
  document.title = pageTitle(title);
  return (
    <div className="page-content admin-dashboard-page account-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">{title}</h2>
            <p className="clinic-page-subtitle mb-0">
              Account module screens will be built in M08. Do not add tables yet.
            </p>
          </div>
        </div>
        <Card className="admin-dash-card">
          <CardBody>
            <p className="text-muted mb-0">This section is a placeholder until the Account finance screens are wired.</p>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AccountPlaceholder;
