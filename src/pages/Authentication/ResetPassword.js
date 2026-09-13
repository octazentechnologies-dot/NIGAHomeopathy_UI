import React, { useMemo, useState } from "react";
import {
  Row,
  Col,
  Alert,
  Card,
  CardBody,
  Container,
  FormFeedback,
  Input,
  Label,
  Form,
  Button,
} from "reactstrap";
import { Link, useParams, useSearchParams } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { pageTitle } from "../../common/brand";
import logoDark from "../../assets/images/logo-dark.png";
import { resetPasswordSecure } from "../../helpers/realbackend_helper";

/**
 * SEC-02.03 — Consumes New-API ResetPassword token from ?token= or /reset-password/:token
 */
const ResetPassword = () => {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const token = useMemo(
    () => (pathToken || queryToken || "").trim(),
    [pathToken, queryToken]
  );

  const [status, setStatus] = useState(token ? "form" : "expired");
  const [errorMsg, setErrorMsg] = useState(
    token ? "" : "This reset link is missing or invalid."
  );
  const [submitting, setSubmitting] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Please enter a new password"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Please confirm your password"),
    }),
    onSubmit: async (values) => {
      if (!token) {
        setStatus("expired");
        setErrorMsg("This reset link is missing or invalid.");
        return;
      }
      setSubmitting(true);
      setErrorMsg("");
      try {
        await resetPasswordSecure({
          token,
          newPassword: values.newPassword,
        });
        setStatus("success");
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "This reset link is invalid or has expired.";
        setStatus("expired");
        setErrorMsg(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  document.title = pageTitle("Reset Password");

  return (
    <ParticlesAuth>
      <div className="auth-page-content">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="mt-4 auth-signin-card">
                <CardBody className="p-4">
                  <div className="text-center mt-2 mb-3">
                    <img
                      src={logoDark}
                      alt="Homeocentrum"
                      className="auth-signin-logo mb-3"
                      height="38"
                    />
                    <h5 className="text-primary mb-0">Reset Password</h5>
                  </div>

                  {status === "success" && (
                    <Alert color="success" className="text-center">
                      Your password has been updated. You can sign in with the
                      new password.
                    </Alert>
                  )}

                  {status === "expired" && (
                    <Alert color="danger" className="text-center">
                      {errorMsg ||
                        "This reset link is invalid or has expired. Request a new one."}
                    </Alert>
                  )}

                  {status === "form" && (
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                      }}
                    >
                      {errorMsg ? (
                        <Alert color="danger">{errorMsg}</Alert>
                      ) : null}
                      <div className="mb-3">
                        <Label htmlFor="newPassword" className="form-label">
                          New password
                        </Label>
                        <Input
                          name="newPassword"
                          type="password"
                          id="newPassword"
                          placeholder="Enter new password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.newPassword}
                          invalid={
                            validation.touched.newPassword &&
                            validation.errors.newPassword
                              ? true
                              : false
                          }
                        />
                        {validation.touched.newPassword &&
                        validation.errors.newPassword ? (
                          <FormFeedback type="invalid">
                            {validation.errors.newPassword}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label htmlFor="confirmPassword" className="form-label">
                          Confirm password
                        </Label>
                        <Input
                          name="confirmPassword"
                          type="password"
                          id="confirmPassword"
                          placeholder="Confirm new password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.confirmPassword}
                          invalid={
                            validation.touched.confirmPassword &&
                            validation.errors.confirmPassword
                              ? true
                              : false
                          }
                        />
                        {validation.touched.confirmPassword &&
                        validation.errors.confirmPassword ? (
                          <FormFeedback type="invalid">
                            {validation.errors.confirmPassword}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mt-4">
                        <Button
                          color="success"
                          className="w-100"
                          type="submit"
                          disabled={submitting}
                        >
                          {submitting ? "Saving…" : "Set new password"}
                        </Button>
                      </div>
                    </Form>
                  )}

                  <div className="mt-4 text-center">
                    <Link to="/login" className="fw-semibold text-primary">
                      Back to sign in
                    </Link>
                    {status === "expired" ? (
                      <>
                        {" · "}
                        <Link
                          to="/forgot-password"
                          className="fw-semibold text-primary"
                        >
                          Request a new link
                        </Link>
                      </>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </ParticlesAuth>
  );
};

export default ResetPassword;
