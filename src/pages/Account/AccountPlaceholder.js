import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { pageTitle } from "../../common/brand";

/** FND-02.01 — Account portal stub only (M08 builds real screens). */
const AccountPlaceholder = ({ title = "Account" }) => {
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
                  Account module screens will be built in M08. Do not add tables
                  yet.
                </p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AccountPlaceholder;
