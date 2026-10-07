import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { Row, Col, Alert, Card, CardBody, Container, FormFeedback, Input, Label, Form } from "reactstrap";

//redux
import { useSelector, useDispatch } from "react-redux";

import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// action
import { userForgetPassword } from "../../slices/thunks";
import { userForgetPasswordReset } from "../../slices/auth/forgetpwd/reducer";

import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { createSelector } from "reselect";
import { pageTitle } from '../../common/brand';
import logoDark from '../../assets/images/logo-dark.png';
import { forgotPasswordAccounts } from "../../helpers/realbackend_helper";

const ForgetPasswordPage = props => {
  const dispatch = useDispatch();
  const [accounts, setAccounts] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    dispatch(userForgetPasswordReset());
    return () => {
      dispatch(userForgetPasswordReset());
    };
  }, [dispatch]);

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .trim()
        .required("Please Enter Your Email or username")
        .test("email-format", "Please enter a valid email address", (value) => {
          if (!value || !String(value).includes("@")) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
        }),
    }),
    onSubmit: async (values) => {
      if (!accounts) {
        setLookupError("");
        setLookingUp(true);
        try {
          const response = await forgotPasswordAccounts(values.email);
          const body = response?.data ?? response;
          const list = Array.isArray(body?.accounts) ? body.accounts : [];
          if (list.length === 0) {
            setAccounts(null);
            setLookupError("If an account exists for those details, a password reset link has been sent.");
            return;
          }
          if (list.length === 1) {
            const only = list[0];
            dispatch(userForgetPassword({
              email: values.email,
              userId: Number(only.userId ?? only.UserId),
            }, props.history));
            return;
          }
          setAccounts(list);
          setSelectedUserId("");
        } catch (err) {
          setAccounts(null);
          if (err?.response?.status === 404) {
            setLookupError("If an account exists for those details, a password reset link has been sent.");
          } else {
            setLookupError(err?.response?.data?.message || err?.message || "Could not look up roles for that email.");
          }
        } finally {
          setLookingUp(false);
        }
        return;
      }
      if (!selectedUserId) {
        setLookupError("Choose the role that should receive the reset link.");
        return;
      }
      const chosen = accounts.find((row) => String(row.userId ?? row.UserId) === String(selectedUserId));
      dispatch(userForgetPassword({
        email: values.email,
        userId: Number(selectedUserId),
        roleName: chosen?.roleName || chosen?.RoleName || "",
      }, props.history));
    }
  });

  const selectLayoutState = (state) => state.ForgetPassword;
  const selectLayoutProperties = createSelector(
    selectLayoutState,
    (state) => ({
      forgetError: state.forgetError,
      forgetSuccessMsg: state.forgetSuccessMsg,
      forgetLoading: state.forgetLoading,
    })
  );
  const {
    forgetError, forgetSuccessMsg, forgetLoading
  } = useSelector(selectLayoutProperties);

  document.title = pageTitle('Forgot Password');
  return (
    <ParticlesAuth>
      <div className="auth-page-content">

        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="mt-4 auth-signin-card">

                <CardBody className="p-4">
                  <div className="text-center mt-2">
                    <img src={logoDark} alt="Homeocentrum" className="auth-signin-logo mb-3" height="38" />
                    <h5 className="text-primary mb-0">Forgot Password?</h5>

                    <lord-icon
                      src="https://cdn.lordicon.com/rhvddzym.json"
                      trigger="loop"
                      colors="primary:#1e88e5"
                      className="avatar-xl"
                      style={{ width: "120px", height: "120px" }}
                    >
                    </lord-icon>

                  </div>

                  <Alert className="border-0 alert-warning text-center mb-2 mx-2" role="alert">
                    {accounts
                      ? accounts.length > 1
                        ? "This email has more than one login. Choose the role, then send the reset link."
                        : "Confirm the role for this email, then send the reset link."
                      : "Enter the email or username. If it has more than one role, you choose which one gets the reset link."}
                  </Alert>
                  <div className="p-2">
                    {lookupError ? (
                      <Alert color="danger" style={{ marginTop: "13px" }}>
                        {lookupError}
                      </Alert>
                    ) : null}
                    {forgetError && forgetError ? (
                      <Alert color="danger" style={{ marginTop: "13px" }}>
                        {forgetError}
                      </Alert>
                    ) : null}
                    {forgetSuccessMsg ? (
                      <Alert color="success" style={{ marginTop: "13px" }}>
                        {forgetSuccessMsg}
                      </Alert>
                    ) : null}
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      <div className="mb-4">
                        <Label className="form-label">Email or username</Label>
                        <Input
                          name="email"
                          className="form-control"
                          placeholder="Enter email or username"
                          type="text"
                          onChange={(e) => {
                            setAccounts(null);
                            setSelectedUserId("");
                            setLookupError("");
                            validation.handleChange(e);
                          }}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email ? true : false
                          }
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid"><div>{validation.errors.email}</div></FormFeedback>
                        ) : null}
                      </div>

                      {accounts && accounts.length > 0 ? (
                        <div className="mb-4">
                          <Label className="form-label">Role</Label>
                          <Input
                            type="select"
                            value={selectedUserId}
                            onChange={(e) => {
                              setSelectedUserId(e.target.value);
                              setLookupError("");
                            }}
                          >
                            <option value="">Select the role for this email</option>
                            {accounts.map((row) => {
                              const id = row.userId ?? row.UserId;
                              const roleName = row.roleName || row.RoleName || "User";
                              const userName = row.userName || row.UserName || "";
                              return (
                                <option key={id} value={id}>
                                  {roleName} — {userName}
                                </option>
                              );
                            })}
                          </Input>
                        </div>
                      ) : null}

                      <div className="text-center mt-4">
                        <button
                          className="btn w-100 auth-signin-btn"
                          type="submit"
                          disabled={forgetLoading || lookingUp}
                        >
                          {lookingUp
                            ? "Looking up roles..."
                            : forgetLoading
                              ? "Sending..."
                              : accounts
                                ? "Send Reset Link"
                                : "Continue"}
                        </button>
                      </div>
                    </Form>

                    <div className="mt-4 text-center">
                      <p className="mb-0">
                        Wait, I remember my password...{" "}
                        <Link
                          to="/login"
                          className="fw-semibold text-primary text-decoration-underline"
                          onClick={() => dispatch(userForgetPasswordReset())}
                        >
                          {" "}Click here{" "}
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
  );
};

ForgetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ForgetPasswordPage);
