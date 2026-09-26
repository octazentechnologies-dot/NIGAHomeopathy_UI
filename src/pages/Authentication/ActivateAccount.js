import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner } from "reactstrap";
import { Link, useSearchParams } from "react-router-dom";

import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { activateByToken, resendActivation } from "../../helpers/realbackend_helper";
import { pageTitle } from "../../common/brand";
import logoDark from "../../assets/images/logo-dark.png";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "working" : "missing");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendNotice, setResendNotice] = useState("");

  useEffect(() => {
    document.title = pageTitle("Activate account");
    if (!token) return undefined;
    let cancelled = false;
    activateByToken({ token })
      .then((payload) => {
        if (cancelled) return;
        setStatus("ok");
        setMessage(payload?.message || "Account activated. You can sign in.");
      })
      .catch((err) => {
        if (cancelled) return;
        const text =
          (typeof err === "string" && err) ||
          err?.response?.data?.message ||
          err?.message ||
          "Activation link expired or already used.";
        const code = err?.response?.status;
        setStatus(code === 410 ? "expired" : "error");
        setMessage(text);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendNotice("");
    if (!email.trim()) return;
    try {
      const payload = await resendActivation({ emailId: email.trim() });
      setResendNotice(payload?.message || "If the account exists and is not activated, an email was sent.");
    } catch {
      setResendNotice("Could not resend. Try again in a minute.");
    }
  };

  return (
    <ParticlesAuth>
      <div className="auth-page-content">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="mt-3 mb-4">
                <CardBody className="p-4 p-lg-5">
                  <div className="text-center mb-4">
                    <img src={logoDark} alt="Homeocentrum" height="38" className="mb-3" />
                    <h4>Activate your account</h4>
                  </div>
                  {status === "working" ? (
                    <div className="text-center py-3">
                      <Spinner color="primary" />
                    </div>
                  ) : null}
                  {status === "missing" ? (
                    <Alert color="warning">This page needs an activation token from your email.</Alert>
                  ) : null}
                  {status === "ok" ? <Alert color="success">{message}</Alert> : null}
                  {status === "expired" || status === "error" ? (
                    <Alert color={status === "expired" ? "warning" : "danger"}>
                      {message || "This activation link has expired (48 hours). Request a new email below."}
                    </Alert>
                  ) : null}
                  {(status === "expired" || status === "error" || status === "missing") && (
                    <form onSubmit={handleResend}>
                      <Label htmlFor="activate-email">Email</Label>
                      <Input
                        id="activate-email"
                        type="email"
                        className="mb-3"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Button color="primary" type="submit" className="w-100">
                        Resend activation email
                      </Button>
                      {resendNotice ? <p className="text-muted mt-3 mb-0">{resendNotice}</p> : null}
                    </form>
                  )}
                  <p className="text-center mt-4 mb-0">
                    <Link to="/login">Sign in</Link>
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

export default ActivateAccount;
