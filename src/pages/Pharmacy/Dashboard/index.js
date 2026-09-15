import React from "react";
import { Container } from "reactstrap";
import SummaryWidgets from "../components/SummaryWidgets";
import "../components/pharmacyDashboard.css";

const PharmacyDashboard = () => {
  document.title = "Pharmacy Dashboard | Niga Homeocentrum";

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page pharmacy-dashboard-page">
        <Container fluid>
          <SummaryWidgets />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default PharmacyDashboard;
