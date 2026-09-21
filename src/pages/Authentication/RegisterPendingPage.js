import React, { useEffect } from "react";
import { Alert, Card, CardBody, Col, Container, Row } from "reactstrap";
import { Link, useLocation } from "react-router-dom";

import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { pageTitle } from "../../common/brand";
import logoDark from "../../assets/images/logo-dark.png";

const RegisterPendingPage = () => {
  const location = useLocation();
  const notice =
    location.state?.notice ||
    "Registration is pending verification. Directory listing stays off until an admin verifies your credentials.";

  useEffect(() => {
    document.title = pageTitle("Registration pending");
  }, []);

  return (
    <ParticlesAuth>
      <div className="auth-page-content">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="mt-3 mb-4">
                <CardBody className="p-4 p-lg-5 text-center">
                  <img src={logoDark} alt="Homeocentrum" height="38" className="mb-3" />
                  <h4 className="mb-3">You&apos;re registered — practice is pending</h4>
                  <Alert color="info" className="text-start">
                    {notice}
                  </Alert>
                  <p className="text-muted">
                    Check email to activate login. Uploaded qualification / registration files go to review.
                    A subscription package does not unlock the public directory.
                  </p>
                  <Link className="btn btn-primary me-2" to="/login">
                    Sign in
                  </Link>
                  <Link className="btn btn-outline-secondary" to="/register/status">
                    Check status
                  </Link>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </ParticlesAuth>
  );
};

export default RegisterPendingPage;
