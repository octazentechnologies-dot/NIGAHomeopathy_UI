import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  CardBody,
  Card,
  Alert,
  Container,
  Input,
  Label,
  Form,
  FormFeedback,
  Button,
  Spinner,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Select from "react-select";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createSelector } from "reselect";

import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { registerUser, apiError, resetRegisterFlag } from "../../slices/thunks";
import {
  getRegistrationCountries,
  getRegistrationStates,
  getRegistrationQualifications,
} from "../../helpers/realbackend_helper";
import { pageTitle } from "../../common/brand";
import logoDark from "../../assets/images/logo-dark.png";

const STEPS = [
  { id: 1, title: "Account", subtitle: "Your login details" },
  { id: 2, title: "Clinic", subtitle: "Practice location" },
  { id: 3, title: "Professional", subtitle: "Credentials" },
];

const stepFieldMap = {
  1: ["firstName", "middleName", "lastName", "userName", "emailId", "mobileNo", "userPassword", "confirmPassword"],
  2: ["companyName", "countryId", "stateId", "city", "permanantAddress"],
  3: ["qualificationId", "passingUniversity", "passingCertNo"],
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 10,
    borderColor: state.isFocused ? "#1e88e5" : "#ced4da",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(30, 136, 229, 0.15)" : "none",
    "&:hover": { borderColor: "#1e88e5" },
  }),
  menu: (base) => ({ ...base, zIndex: 20, borderRadius: 10 }),
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordShow, setPasswordShow] = useState(false);
  const [confirmPasswordShow, setConfirmPasswordShow] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [step3Attempted, setStep3Attempted] = useState(false);

  const registerdatatype = createSelector(
    (state) => state.Account,
    (account) => ({
      success: account.success,
      error: account.error,
      loading: account.loading,
      registrationError: account.registrationError,
      message: account.message,
      user: account.user,
    })
  );

  const { error, success, loading, registrationError, message, user } = useSelector(registerdatatype);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      userName: "",
      emailId: "",
      mobileNo: "",
      userPassword: "",
      confirmPassword: "",
      companyName: "",
      countryId: 78,
      stateId: null,
      city: "",
      permanantAddress: "",
      qualificationId: null,
      passingUniversity: "",
      passingCertNo: "",
    },
    validationSchema: Yup.object({
      firstName: Yup.string().trim().required("Please enter first name"),
      middleName: Yup.string().trim(),
      lastName: Yup.string().trim().required("Please enter last name"),
      userName: Yup.string().trim().required("Please enter user name"),
      emailId: Yup.string().email("Please enter a valid email").required("Please enter email"),
      mobileNo: Yup.string()
        .trim()
        .matches(/^[0-9+\-\s()]{8,15}$/, "Please enter a valid mobile number")
        .required("Please enter mobile number"),
      userPassword: Yup.string().min(4, "Password must be at least 4 characters").required("Please enter password"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("userPassword")], "Passwords do not match")
        .required("Please confirm password"),
      companyName: Yup.string().trim().required("Please enter clinic / company name"),
      countryId: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null || originalValue === undefined ? undefined : value
        )
        .required("Please select country")
        .min(1, "Please select country"),
      stateId: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null || originalValue === undefined ? null : value
        )
        .nullable(),
      city: Yup.string().trim(),
      permanantAddress: Yup.string().trim(),
      qualificationId: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null || originalValue === undefined ? undefined : Number(originalValue)
        )
        .typeError("Please select qualification")
        .required("Please select qualification")
        .min(1, "Please select qualification"),
      passingUniversity: Yup.string().trim(),
      passingCertNo: Yup.string().trim(),
    }),
    onSubmit: (values) => {
      const payload = {
        firstName: values.firstName.trim(),
        middleName: values.middleName?.trim() || "",
        lastName: values.lastName.trim(),
        userName: values.userName.trim(),
        emailId: values.emailId.trim(),
        mobileNo: values.mobileNo.trim(),
        userPassword: values.userPassword,
        companyName: values.companyName.trim(),
        countryId: Number(values.countryId),
        stateId: values.stateId ? Number(values.stateId) : null,
        city: values.city?.trim() || "",
        permanantAddress: values.permanantAddress?.trim() || "",
        qualificationId: Number(values.qualificationId),
        passingUniversity: values.passingUniversity?.trim() || "",
        passingCertNo: values.passingCertNo?.trim() || "",
      };
      dispatch(registerUser(payload));
    },
  });

  const countryOptions = useMemo(
    () =>
      (countries || [])
        .map((c) => ({
          value: Number(c.countryId ?? c.CountryId),
          label: c.countryName ?? c.CountryName,
        }))
        .filter((o) => Number.isFinite(o.value) && o.label),
    [countries]
  );

  const stateOptions = useMemo(
    () =>
      (states || [])
        .map((s) => ({
          value: Number(s.stateId ?? s.StateId),
          label: s.stateName ?? s.StateName,
        }))
        .filter((o) => Number.isFinite(o.value) && o.label),
    [states]
  );

  const qualificationOptions = useMemo(
    () =>
      (qualifications || [])
        .map((q) => ({
          value: Number(q.qualificationId ?? q.QualificationId),
          label: q.qualificationName ?? q.QualificationName,
        }))
        .filter((o) => Number.isFinite(o.value) && o.value > 0 && o.label),
    [qualifications]
  );

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }
    setStatesLoading(true);
    try {
      const list = await getRegistrationStates(countryId);
      setStates(Array.isArray(list) ? list : []);
    } catch {
      setStates([]);
    } finally {
      setStatesLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(apiError());
    let cancelled = false;

    const loadLookups = async () => {
      setLookupsLoading(true);
      setLookupError("");
      try {
        const [countryList, qualificationList] = await Promise.all([
          getRegistrationCountries(),
          getRegistrationQualifications(),
        ]);
        if (cancelled) return;
        setCountries(Array.isArray(countryList) ? countryList : []);
        setQualifications(Array.isArray(qualificationList) ? qualificationList : []);
        if (!Array.isArray(qualificationList) || qualificationList.length === 0) {
          setLookupError("No qualifications found. Please ask admin to add Qualifications under Business Management.");
        }
      } catch {
        if (!cancelled) {
          setLookupError("Unable to load registration options. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setLookupsLoading(false);
      }
    };

    loadLookups();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (validation.values.countryId) {
      loadStates(validation.values.countryId);
    }
  }, [validation.values.countryId, loadStates]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => {
      dispatch(resetRegisterFlag());
      navigate("/login", {
        state: {
          registered: true,
          userName: user?.userName,
          notice: "Account created. Sign in, then choose your subscription plan.",
        },
      });
    }, 2200);
    return () => clearTimeout(timer);
  }, [success, dispatch, navigate, user]);

  document.title = pageTitle("Doctor Registration");

  const validateStep = async (step) => {
    const fields = stepFieldMap[step] || [];
    const touched = {};
    fields.forEach((field) => {
      touched[field] = true;
    });
    validation.setTouched({ ...validation.touched, ...touched }, true);
    const errors = await validation.validateForm();
    return !fields.some((field) => errors[field]);
  };

  const handleNext = async () => {
    const ok = await validateStep(currentStep);
    if (ok) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setStep3Attempted(true);
    const ok = await validateStep(3);
    if (!ok) return;
    validation.handleSubmit();
  };

  const selectedCountry =
    countryOptions.find((o) => Number(o.value) === Number(validation.values.countryId)) || null;
  const selectedState =
    stateOptions.find((o) => Number(o.value) === Number(validation.values.stateId)) || null;
  const selectedQualification =
    qualificationOptions.find((o) => Number(o.value) === Number(validation.values.qualificationId)) || null;

  const showQualificationError =
    (step3Attempted || validation.touched.qualificationId) && !!validation.errors.qualificationId;

  return (
    <React.Fragment>
      <ParticlesAuth>
        <div className="auth-page-content">
          <Container>
            <Row className="justify-content-center">
              <Col lg={10} xl={9}>
                <Card className="mt-3 mb-4 auth-signin-card auth-register-card">
                  <CardBody className="p-4 p-lg-5">
                    <div className="text-center mb-4">
                      <img src={logoDark} alt="Homeocentrum" className="auth-signin-logo mb-3" height="38" />
                      <h4 className="auth-register-title mb-1">Register as a Doctor</h4>
                      <p className="text-muted mb-0 auth-register-lead">
                        Create your practice profile. After sign-in you can choose a subscription plan.
                      </p>
                    </div>

                    {!success && (
                      <div className="auth-register-steps mb-4" aria-label="Registration progress">
                        {STEPS.map((step, index) => {
                          const active = currentStep === step.id;
                          const done = currentStep > step.id;
                          return (
                            <React.Fragment key={step.id}>
                              <div className={`auth-register-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}>
                                <div className="auth-register-step__index">
                                  {done ? <i className="ri-check-line" aria-hidden="true" /> : step.id}
                                </div>
                                <div className="auth-register-step__copy">
                                  <span className="auth-register-step__title">{step.title}</span>
                                  <span className="auth-register-step__subtitle">{step.subtitle}</span>
                                </div>
                              </div>
                              {index < STEPS.length - 1 && <div className={`auth-register-step__connector ${done ? "is-done" : ""}`} />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                    {success ? (
                      <div className="auth-register-success text-center py-4">
                        <div className="auth-register-success__icon mb-3">
                          <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                        </div>
                        <h5 className="mb-2">You&apos;re registered</h5>
                        <p className="text-muted mb-3">
                          {message || "Account created successfully. Redirecting you to sign in…"}
                        </p>
                        <Alert color="info" className="text-start mb-0">
                          Next: sign in, then select your subscription package to unlock the doctor dashboard.
                        </Alert>
                      </div>
                    ) : (
                      <Form onSubmit={handleFinalSubmit} className="needs-validation" noValidate>
                        {(error || registrationError) && (
                          <Alert color="danger" className="mb-3">
                            {registrationError || "Registration failed. Please try again."}
                          </Alert>
                        )}
                        {lookupError && (
                          <Alert color="warning" className="mb-3">
                            {lookupError}
                          </Alert>
                        )}

                        {currentStep === 1 && (
                          <div className="auth-register-panel">
                            <h6 className="auth-register-panel__title">Account details</h6>
                            <Row className="g-3">
                              <Col md={4}>
                                <Label htmlFor="firstName" className="form-label">First name <span className="text-danger">*</span></Label>
                                <Input
                                  id="firstName"
                                  name="firstName"
                                  type="text"
                                  placeholder="First name"
                                  value={validation.values.firstName}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.firstName && !!validation.errors.firstName}
                                />
                                {validation.touched.firstName && validation.errors.firstName ? (
                                  <FormFeedback type="invalid">{validation.errors.firstName}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={4}>
                                <Label htmlFor="middleName" className="form-label">Middle name</Label>
                                <Input
                                  id="middleName"
                                  name="middleName"
                                  type="text"
                                  placeholder="Optional"
                                  value={validation.values.middleName}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                />
                              </Col>
                              <Col md={4}>
                                <Label htmlFor="lastName" className="form-label">Last name <span className="text-danger">*</span></Label>
                                <Input
                                  id="lastName"
                                  name="lastName"
                                  type="text"
                                  placeholder="Last name"
                                  value={validation.values.lastName}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.lastName && !!validation.errors.lastName}
                                />
                                {validation.touched.lastName && validation.errors.lastName ? (
                                  <FormFeedback type="invalid">{validation.errors.lastName}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="userName" className="form-label">User name <span className="text-danger">*</span></Label>
                                <Input
                                  id="userName"
                                  name="userName"
                                  type="text"
                                  placeholder="Choose a login user name"
                                  value={validation.values.userName}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.userName && !!validation.errors.userName}
                                />
                                {validation.touched.userName && validation.errors.userName ? (
                                  <FormFeedback type="invalid">{validation.errors.userName}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="emailId" className="form-label">Email <span className="text-danger">*</span></Label>
                                <Input
                                  id="emailId"
                                  name="emailId"
                                  type="email"
                                  placeholder="name@example.com"
                                  value={validation.values.emailId}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.emailId && !!validation.errors.emailId}
                                />
                                {validation.touched.emailId && validation.errors.emailId ? (
                                  <FormFeedback type="invalid">{validation.errors.emailId}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="mobileNo" className="form-label">Mobile number <span className="text-danger">*</span></Label>
                                <Input
                                  id="mobileNo"
                                  name="mobileNo"
                                  type="tel"
                                  placeholder="e.g. 9876543210"
                                  value={validation.values.mobileNo}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.mobileNo && !!validation.errors.mobileNo}
                                />
                                {validation.touched.mobileNo && validation.errors.mobileNo ? (
                                  <FormFeedback type="invalid">{validation.errors.mobileNo}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6} className="d-none d-md-block" />
                              <Col md={6}>
                                <Label htmlFor="userPassword" className="form-label">Password <span className="text-danger">*</span></Label>
                                <div className="position-relative auth-pass-inputgroup">
                                  <Input
                                    id="userPassword"
                                    name="userPassword"
                                    type={passwordShow ? "text" : "password"}
                                    placeholder="Create a password"
                                    value={validation.values.userPassword}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.userPassword && !!validation.errors.userPassword}
                                  />
                                  <button
                                    className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                    type="button"
                                    onClick={() => setPasswordShow((v) => !v)}
                                    aria-label={passwordShow ? "Hide password" : "Show password"}
                                  >
                                    <i className="ri-eye-fill align-middle" />
                                  </button>
                                  {validation.touched.userPassword && validation.errors.userPassword ? (
                                    <FormFeedback type="invalid">{validation.errors.userPassword}</FormFeedback>
                                  ) : null}
                                </div>
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="confirmPassword" className="form-label">Confirm password <span className="text-danger">*</span></Label>
                                <div className="position-relative auth-pass-inputgroup">
                                  <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={confirmPasswordShow ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={validation.values.confirmPassword}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.confirmPassword && !!validation.errors.confirmPassword}
                                  />
                                  <button
                                    className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                    type="button"
                                    onClick={() => setConfirmPasswordShow((v) => !v)}
                                    aria-label={confirmPasswordShow ? "Hide password" : "Show password"}
                                  >
                                    <i className="ri-eye-fill align-middle" />
                                  </button>
                                  {validation.touched.confirmPassword && validation.errors.confirmPassword ? (
                                    <FormFeedback type="invalid">{validation.errors.confirmPassword}</FormFeedback>
                                  ) : null}
                                </div>
                              </Col>
                            </Row>
                          </div>
                        )}

                        {currentStep === 2 && (
                          <div className="auth-register-panel">
                            <h6 className="auth-register-panel__title">Clinic &amp; location</h6>
                            <Row className="g-3">
                              <Col md={12}>
                                <Label htmlFor="companyName" className="form-label">Clinic / company name <span className="text-danger">*</span></Label>
                                <Input
                                  id="companyName"
                                  name="companyName"
                                  type="text"
                                  placeholder="Your clinic or practice name"
                                  value={validation.values.companyName}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.companyName && !!validation.errors.companyName}
                                />
                                {validation.touched.companyName && validation.errors.companyName ? (
                                  <FormFeedback type="invalid">{validation.errors.companyName}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label className="form-label">Country <span className="text-danger">*</span></Label>
                                <Select
                                  options={countryOptions}
                                  value={selectedCountry}
                                  isLoading={lookupsLoading}
                                  placeholder="Select country"
                                  styles={selectStyles}
                                  onChange={(option) => {
                                    validation.setFieldValue("countryId", option?.value || null);
                                    validation.setFieldValue("stateId", null);
                                  }}
                                  onBlur={() => validation.setFieldTouched("countryId", true)}
                                />
                                {validation.touched.countryId && validation.errors.countryId ? (
                                  <div className="invalid-feedback d-block">{validation.errors.countryId}</div>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label className="form-label">State</Label>
                                <Select
                                  options={stateOptions}
                                  value={selectedState}
                                  isLoading={statesLoading}
                                  isClearable
                                  placeholder={statesLoading ? "Loading states…" : "Select state (optional)"}
                                  styles={selectStyles}
                                  onChange={(option) => validation.setFieldValue("stateId", option?.value || null)}
                                />
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="city" className="form-label">City</Label>
                                <Input
                                  id="city"
                                  name="city"
                                  type="text"
                                  placeholder="City"
                                  value={validation.values.city}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                />
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="permanantAddress" className="form-label">Permanent address</Label>
                                <Input
                                  id="permanantAddress"
                                  name="permanantAddress"
                                  type="text"
                                  placeholder="Clinic or residential address"
                                  value={validation.values.permanantAddress}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                />
                              </Col>
                            </Row>
                          </div>
                        )}

                        {currentStep === 3 && (
                          <div className="auth-register-panel">
                            <h6 className="auth-register-panel__title">Professional credentials</h6>
                            <Row className="g-3">
                              <Col md={12}>
                                <Label className="form-label">Qualification <span className="text-danger">*</span></Label>
                                <Select
                                  options={qualificationOptions}
                                  value={selectedQualification}
                                  isLoading={lookupsLoading}
                                  isClearable
                                  placeholder={
                                    lookupsLoading
                                      ? "Loading qualifications…"
                                      : qualificationOptions.length
                                        ? "Select qualification"
                                        : "No qualifications available"
                                  }
                                  noOptionsMessage={() => "No qualifications found. Ask admin to add them."}
                                  styles={{
                                    ...selectStyles,
                                    control: (base, state) => ({
                                      ...selectStyles.control(base, state),
                                      borderColor: showQualificationError
                                        ? "#f06548"
                                        : state.isFocused
                                          ? "#1e88e5"
                                          : "#ced4da",
                                    }),
                                  }}
                                  onChange={(option) => {
                                    const nextValue = option?.value != null ? Number(option.value) : null;
                                    validation.setFieldValue("qualificationId", nextValue, true);
                                    if (nextValue) {
                                      validation.setFieldError("qualificationId", undefined);
                                      validation.setFieldTouched("qualificationId", true, false);
                                    }
                                  }}
                                />
                                {showQualificationError ? (
                                  <div className="invalid-feedback d-block">{validation.errors.qualificationId}</div>
                                ) : null}
                                {!lookupsLoading && qualificationOptions.length === 0 ? (
                                  <div className="text-warning mt-1" style={{ fontSize: "0.85rem" }}>
                                    No qualifications loaded. Add them in Admin → Business Management → Qualifications.
                                  </div>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="passingUniversity" className="form-label">Passing university</Label>
                                <Input
                                  id="passingUniversity"
                                  name="passingUniversity"
                                  type="text"
                                  placeholder="University name"
                                  value={validation.values.passingUniversity}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                />
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="passingCertNo" className="form-label">Certificate / registration no.</Label>
                                <Input
                                  id="passingCertNo"
                                  name="passingCertNo"
                                  type="text"
                                  placeholder="Certificate number"
                                  value={validation.values.passingCertNo}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                />
                              </Col>
                              <Col xs={12}>
                                <div className="auth-register-note">
                                  <i className="ri-information-line me-1" aria-hidden="true" />
                                  Package and subscription are selected after you sign in — not during registration.
                                </div>
                              </Col>
                            </Row>
                          </div>
                        )}

                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
                          {currentStep > 1 ? (
                            <Button color="light" type="button" className="auth-register-secondary-btn" onClick={handleBack} disabled={loading}>
                              Back
                            </Button>
                          ) : (
                            <span />
                          )}

                          {currentStep < STEPS.length ? (
                            <Button color="primary" type="button" className="auth-signin-btn px-4" onClick={handleNext}>
                              Continue
                            </Button>
                          ) : (
                            <Button color="primary" type="submit" className="auth-signin-btn px-4" disabled={loading || lookupsLoading}>
                              {loading ? (
                                <>
                                  <Spinner size="sm" className="me-2" /> Creating account…
                                </>
                              ) : (
                                "Create doctor account"
                              )}
                            </Button>
                          )}
                        </div>
                      </Form>
                    )}

                    <div className="mt-4 text-center">
                      <p className="mb-0">
                        Already have an account?{" "}
                        <Link to="/login" className="fw-semibold text-primary text-decoration-underline">
                          Sign in
                        </Link>
                      </p>
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

export default Register;
