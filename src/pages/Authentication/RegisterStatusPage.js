import React, { useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row } from "reactstrap";
import { Link } from "react-router-dom";

import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { getRegistrationStatus } from "../../helpers/realbackend_helper";
import { pageTitle } from "../../common/brand";
import logoDark from "../../assets/images/logo-dark.png";

const RegisterStatusPage = () => {
  const [emailId, setEmailId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  document.title = pageTitle("Registration status");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = await getRegistrationStatus(emailId.trim());
      setResult(payload);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Could not check status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParticlesAuth>
      <div className="auth-page-content">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="mt-3 mb-4">
                <CardBody className="p-4 p-lg-5">
                  <div className="text-center mb-4">
                    <img src={logoDark} alt="Homeocentrum" height="38" className="mb-3" />
                    <h4>Registration status</h4>
                  </div>
                  <form onSubmit={onSubmit}>
                    <Label htmlFor="status-email">Email used at register</Label>
                    <Input
                      id="status-email"
                      type="email"
                      className="mb-3"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      required
                    />
                    <Button color="primary" type="submit" className="w-100" disabled={loading}>
                      {loading ? "Checking…" : "Check"}
                    </Button>
                  </form>
                  {error ? <Alert color="danger" className="mt-3">{error}</Alert> : null}
                  {result ? (
                    <Alert color={result.found ? "info" : "warning"} className="mt-3 mb-0">
                      {result.found ? (
                        <>
                          Login activated: {result.activated ? "Yes" : "No"}. Verification:{" "}
                          {result.verificationStatus || "Pending"}. Directory visible:{" "}
                          {result.directoryVisible ? "Yes" : "No"}.
                        </>
                      ) : (
                        result.message || "No registration found for that email."
                      )}
                    </Alert>
                  ) : null}
                  <p className="text-center mt-4 mb-0">
                    <Link to="/register">Register</Link> · <Link to="/login">Sign in</Link>
                  </p>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </ParticlesAuth>
  );
};

export default RegisterStatusPage;
