import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import "./pharmacyDashboard.css";

const TITLE_BY_PATH = {
  "/pharmacy/onboarding": "Onboarding",
  "/pharmacy/orders": "Orders",
  "/pharmacy/quotes": "Quotes",
  "/pharmacy/inventory": "Inventory",
  "/pharmacy/prescriptions": "Prescriptions",
};

const PharmacyComingSoon = ({ title }) => {
  const { pathname } = useLocation();
  const pageTitle = title || TITLE_BY_PATH[pathname] || "Pharmacy";
  document.title = `${pageTitle} | Niga Homeocentrum`;

  return (
    <div className="page-content admin-dashboard-page pharmacy-dashboard-page">
      <Container fluid>
        <Row className="justify-content-center">
          <Col lg={7} xl={6}>
            <Card className="admin-dash-card pharmacy-notice-card mb-0">
              <CardBody className="text-center py-5">
                <h2 className="pharmacy-page-title mb-2">{pageTitle}</h2>
                <p className="pharmacy-page-subtitle mb-4">
                  This pharmacy screen will be available soon.
                </p>
                <Link to="/pharmacydashboard" className="btn btn-sm pharmacy-primary-btn">
                  Back to Pharmacy Home
                </Link>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PharmacyComingSoon;
