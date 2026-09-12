import React from "react";
import { Container } from "reactstrap";
import SummaryWidgets from "../components/SummaryWidgets";
import "../components/accountDashboard.css";

const AccountDashboard = () => {
  document.title = "Account Dashboard | Niga Homeocentrum";

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page account-dashboard-page">
        <Container fluid>
          <SummaryWidgets />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AccountDashboard;
