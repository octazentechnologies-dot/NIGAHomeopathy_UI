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

const ICON_BY_TITLE = {
  Ledger: "ri-book-2-line",
  "Doctor Earnings": "ri-money-dollar-circle-line",
  Payouts: "ri-hand-coin-line",
  Invoices: "ri-bill-line",
  Reports: "ri-bar-chart-box-line",
  Account: "ri-bank-card-line",
};

const AccountComingSoon = ({ title }) => {
  const { pathname } = useLocation();
  const pageTitle = title || TITLE_BY_PATH[pathname] || "Account";
  document.title = `${pageTitle} | Niga Homeocentrum`;

  return (
    <div className="page-content admin-dashboard-page account-dashboard-page clinic-workspace-page">
      <Container fluid>
        <Row className="justify-content-center">
          <Col lg={7} xl={6}>
            <Card className="admin-dash-card account-notice-card mb-0">
              <CardBody className="text-center py-5">
                <h2 className="clinic-page-title account-page-title mb-2"><i className={ICON_BY_TITLE[pageTitle] || "ri-bank-card-line"} aria-hidden="true" />{pageTitle}</h2>
                <p className="account-page-subtitle mb-4">
                  This screen will be built in M08. Do not add tables yet.
                </p>
                <Link to="/accountdashboard" className="btn btn-sm btn-soft-primary">
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
