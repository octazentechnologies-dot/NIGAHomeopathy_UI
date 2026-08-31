import React, { useState } from "react";
import { Col, Container, Row } from "reactstrap";
import Widget from "./Widgets";
import BestSellingProducts from "./BestSellingProducts";
import RecentActivity from "./RecentActivity";
import RecentOrders from "./RecentOrders";
import StoreVisits from "./StoreVisits";
import TopSellers from "./TopSellers";

const DashboardEcommerce = () => {
  document.title = "Dashboard | Niga Homeocentrum";

  const [rightColumn, setRightColumn] = useState(false);

  const toggleRightColumn = () => {
    setRightColumn(!rightColumn);
  };

  return (
    <React.Fragment>
      <div className="page-content doctor-dashboard-page">
        <Container fluid>
          <Row>
            <Col>
              <div className="h-100 doctor-dashboard-shell">
                <Widget />
                <Row className="doctor-dashboard-patient-row align-items-stretch">
                  <BestSellingProducts />
                  <TopSellers />
                </Row>

                <Row className="doctor-dashboard-stats-row align-items-stretch">
                  <StoreVisits />
                  <RecentOrders />
                </Row>
              </div>
            </Col>
            <RecentActivity rightColumn={rightColumn} hideRightColumn={toggleRightColumn} />
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;
