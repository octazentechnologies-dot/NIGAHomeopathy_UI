import React from "react";
import { Container } from "reactstrap";
import SummaryWidgets from "../components/SummaryWidgets";
import TodaysAppointments from "../components/TodaysAppointments";
import "../components/receptionDashboard.css";

/** Reception overview in clinic chrome — live queue KPIs + appointment table (not the doctor board). */
const ReceptionDashboard = () => {
  document.title = "Reception | Homeocentrum";

  return (
    <div className="page-content admin-dashboard-page doctor-dashboard-page reception-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Reception</h2>
        <p className="clinic-page-subtitle">
          Waiting and unpaid counts come from today&apos;s queue. Collect payment stays on Reception home.
        </p>
        <SummaryWidgets />
        <TodaysAppointments />
      </Container>
    </div>
  );
};

export default ReceptionDashboard;
