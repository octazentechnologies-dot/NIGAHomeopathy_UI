import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import "./receptionDashboard.css";

const TITLE_BY_PATH = {
  "/reception/appointments": "Appointments",
  "/reception/patients": "Patients",
  "/reception/payments": "Payments",
  "/reception/schedule": "Schedule",
};

const ReceptionComingSoon = ({ title }) => {
  const { pathname } = useLocation();
  const pageTitle = title || TITLE_BY_PATH[pathname] || "Reception";
  document.title = `${pageTitle} | Niga Homeocentrum`;

  return (
    <div className="page-content admin-dashboard-page reception-dashboard-page">
      <Container fluid>
        <Row className="justify-content-center">
          <Col lg={7} xl={6}>
            <Card className="admin-dash-card reception-notice-card mb-0">
              <CardBody className="text-center py-5">
                <h2 className="reception-page-title mb-2">{pageTitle}</h2>
                <p className="reception-page-subtitle mb-4">
                  This screen is ready for reception workflows. Content will be added next.
                </p>
                <Link to="/receptiondashboard" className="btn btn-sm reception-primary-btn">
                  Back to Dashboard
                </Link>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ReceptionComingSoon;
