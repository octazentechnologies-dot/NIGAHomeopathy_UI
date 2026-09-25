import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { pageTitle } from "../../common/brand";

/** FND-02.01 — Pharmacy / HomeoMeds stub only. */
const PharmacyPlaceholder = ({ title = "Pharmacy" }) => {
  document.title = pageTitle(title);
  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <h4 className="mb-2">{title}</h4>
                <p className="text-muted mb-0">
                  Pharmacy / HomeoMeds screens will be built later. Stub only.
                </p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PharmacyPlaceholder;
