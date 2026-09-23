import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Row,
  Button,
  Form,
  FormFeedback,
  Alert,
  Spinner,
} from "reactstrap";
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
import * as Yup from "yup";
import { useFormik } from "formik";
import { loginUser } from "../../slices/thunks";
import { reset_login_flag } from "../../slices/auth/login/reducer";
import { activateUser, activateByToken } from "../../helpers/realbackend_helper";
import { createSelector } from "reselect";
import { pageTitle } from "../../common/brand";
import logoDark from "../../assets/images/logo-dark.png";

const Login = (props) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const loginpageData = createSelector(
    (state) => state,
    (state) => ({
      error: state.Login.error,
      loading: state.Login.loading,
      errorMsg: state.Login.errorMsg,
    })
  );

  const { error, loading, errorMsg } = useSelector(loginpageData);

  const [passwordShow, setPasswordShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [infoNotice] = useState(location.state?.notice || "");
  const [activationNotice, setActivationNotice] = useState("");

  useEffect(() => {
    const encryptedUserId = searchParams.get("UserId");
    const token = searchParams.get("token");
    const activatedFlag = (searchParams.get("activated") || searchParams.get("activation") || "").toLowerCase();
    if (!encryptedUserId && !token) {
      if (activatedFlag === "expired" || activatedFlag === "0" || activatedFlag === "false") {
        setActivationNotice("This activation link expired (48 hours). Open /activate to request a new email.");
      } else if (activatedFlag === "1" || activatedFlag === "true" || activatedFlag === "ok") {
        setActivationNotice("Your account is activated. Please sign in to continue.");
      }
      return undefined;
    }

    let cancelled = false;
    const run = encryptedUserId
      ? activateUser({ encryptedUserId })
      : activateByToken({ token });
    run
      .then(() => {
        if (!cancelled) {
          setActivationNotice("Your account is activated. Please sign in to continue.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const expired = err?.response?.status === 410;
          setActivationNotice(
            expired
              ? "This activation link expired (48 hours). Open /activate to request a new email."
              : "If your account is already active, you can sign in below. If the link expired, request a new activation email."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      userName: location.state?.userName || "",
      password: "",
    },
    validationSchema: Yup.object({
      userName: Yup.string().trim().required("Please enter your user name"),
      password: Yup.string().required("Please enter your password"),
    }),
    onSubmit: (values) => {
      dispatch(reset_login_flag());
      dispatch(loginUser(values, props.router.navigate));
    },
  });

  document.title = pageTitle("Sign In");

  return (
    <React.Fragment>
      <ParticlesAuth>
        <div className="auth-page-content">
          <Container>
            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="mt-3 mb-4 auth-signin-card auth-register-card auth-login-card">
                  <CardBody className="p-4 p-lg-5">
                    <div className="text-center mb-4">
                      <img
                        src={logoDark}
                        alt="Homeocentrum"
                        className="auth-signin-logo mb-3"
                        height="38"
                      />
                      <h4 className="auth-register-title mb-0">Sign in to Homeocentrum</h4>
                    </div>

                    {infoNotice ? (
                      <Alert color="success" className="auth-login-alert mb-3">
                        {infoNotice}
                      </Alert>
                    ) : null}
                    {activationNotice ? (
                      <Alert color="info" className="auth-login-alert mb-3">
                        {activationNotice}
                      </Alert>
                    ) : null}
                    {error ? (
                      <Alert color="danger" className="auth-login-alert mb-3" data-testid="login-error">
                        {typeof error === "string" ? error : String(error?.message || error || "Invalid username or password")}
                      </Alert>
                    ) : null}

                    <div className="auth-register-panel">
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          validation.handleSubmit();
                          return false;
                        }}
                        className="needs-validation"
                        noValidate
                      >
                        <div className="mb-3">
                          <Label htmlFor="userName" className="form-label">
                            User name <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="userName"
                            name="userName"
                            className="form-control auth-login-input"
                            placeholder="Enter your user name"
                            type="text"
                            autoComplete="username"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.userName || ""}
                            invalid={validation.touched.userName && !!validation.errors.userName}
                          />
                          {validation.touched.userName && validation.errors.userName ? (
                            <FormFeedback type="invalid">{validation.errors.userName}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <Label className="form-label mb-0" htmlFor="password-input">
                              Password <span className="text-danger">*</span>
                            </Label>
                            <Link to="/forgot-password" className="auth-login-forgot">
                              Forgot password?
                            </Link>
                          </div>
                          <div className="auth-pass-inputgroup mt-2">
                            <div className="auth-pass-inputgroup__control">
                              <Input
                                id="password-input"
                                name="password"
                                value={validation.values.password || ""}
                                type={passwordShow ? "text" : "password"}
                                className="form-control auth-login-input"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                invalid={validation.touched.password && !!validation.errors.password}
                              />
                              <button
                                className="auth-pass-inputgroup__toggle"
                                type="button"
                                id="password-addon"
                                aria-label={passwordShow ? "Hide password" : "Show password"}
                                onClick={() => setPasswordShow((v) => !v)}
                              >
                                <i className={passwordShow ? "ri-eye-off-fill" : "ri-eye-fill"} aria-hidden="true" />
                              </button>
                            </div>
                            {validation.touched.password && validation.errors.password ? (
                              <FormFeedback type="invalid" className="d-block">
                                {validation.errors.password}
                              </FormFeedback>
                            ) : null}
                          </div>
                        </div>

                        <div className="form-check mb-4">
                          <Input
                            className="form-check-input"
                            type="checkbox"
                            id="auth-remember-check"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <Label className="form-check-label" htmlFor="auth-remember-check">
                            Keep me signed in on this device
                          </Label>
                        </div>

                        <Button
                          disabled={!!loading}
                          className="w-100 auth-signin-btn auth-login-submit"
                          type="submit"
                        >
                          {loading ? <Spinner size="sm" className="me-2" /> : null}
                          Sign in
                        </Button>
                      </Form>

                      <div className="auth-register-note mt-4 mb-0">
                        <i className="ri-stethoscope-line me-1" aria-hidden="true" />
                        New doctor? Create your account, then choose a subscription after sign-in.
                      </div>

                      <div className="mt-4 text-center">
                        <p className="mb-0">
                          Don&apos;t have an account?{" "}
                          <Link
                            to="/register"
                            className="fw-semibold text-primary text-decoration-underline"
                          >
                            Register as a Doctor
                          </Link>
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </ParticlesAuth>
    </React.Fragment>
  );
};

export default withRouter(Login);
