import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import "./accountDashboard.css";

const TITLE_BY_PATH = {
  "/account/ledger": "Ledger",
  "/account/doctor-earnings": "Doctor Earnings",
  "/account/payouts": "Payouts",
  "/account/invoices": "Invoices",
  "/account/reports": "Reports",
};

const AccountComingSoon = ({ title }) => {
  const { pathname } = useLocation();
  const pageTitle = title || TITLE_BY_PATH[pathname] || "Account";
  document.title = `${pageTitle} | Niga Homeocentrum`;

  return (
    <div className="page-content admin-dashboard-page account-dashboard-page">
      <Container fluid>
        <Row className="justify-content-center">
          <Col lg={7} xl={6}>
            <Card className="admin-dash-card account-notice-card mb-0">
              <CardBody className="text-center py-5">
                <h2 className="account-page-title mb-2">{pageTitle}</h2>
                <p className="account-page-subtitle mb-4">
                  This screen will be built in M08. Do not add tables yet.
                </p>
                <Link to="/accountdashboard" className="btn btn-sm account-primary-btn">
                  Back to Account Home
                </Link>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AccountComingSoon;
