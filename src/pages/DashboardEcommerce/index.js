import React, { useState } from "react";
import { Col, Container, Row } from "reactstrap";
import Widget from "./Widgets";
import BestSellingProducts from "./BestSellingProducts";
import RecentActivity from "./RecentActivity";
import RecentOrders from "./RecentOrders";
import Revenue from "./Revenue";
import SalesByLocations from "./SalesByLocations";
import StoreVisits from "./StoreVisits";
import TopSellers from "./TopSellers";

const DashboardEcommerce = () => {
  document.title = "Dashboard | Velzon - React Admin & Dashboard Template";

  const [rightColumn, setRightColumn] = useState(false);
  const toggleRightColumn = () => {
    setRightColumn(!rightColumn);
  };

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page">
        <Container fluid>
          <Row>
            <Col>
              <div className="h-100">
                <Row className="g-2">
                  <Widget />
                </Row>
                <Row className="g-2">
                  <Col xl={8}>
                    <Revenue />
                  </Col>
                  <SalesByLocations />
                </Row>
                <Row className="g-2">
                  <BestSellingProducts />
                  <TopSellers />
                </Row>
                <Row className="g-2">
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
