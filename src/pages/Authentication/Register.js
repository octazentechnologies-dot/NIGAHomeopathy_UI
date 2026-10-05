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
  getRegistrationDistricts,
  getRegistrationCities,
  getRegistrationPinCodes,
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
  1: ["firstName", "middleName", "lastName", "userName", "emailId", "countryCode", "mobileNo", "userPassword", "confirmPassword"],
  2: ["companyName", "countryId", "stateId", "districtId", "city", "addressLine1", "addressLine2", "landmark", "postalCode"],
  3: ["qualificationId", "passingUniversity", "passingCertNo"],
};

// Dial-code helpers: backend codes vary ("+1 684", "+1-268", "+672, +64").
// Option values are normalized to "+<digits>"; labels keep backend formatting.
const normalizeDialCode = (code) => {
  const digits = String(code || "").replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
};
const splitDialCodes = (code) =>
  String(code || "")
    .split(",")
    .map(normalizeDialCode)
    .filter(Boolean);

// Fallback when the countries API omits dial codes.
const FALLBACK_DIAL_CODES = ["+91", "+1", "+44", "+61", "+65", "+971", "+966", "+880", "+977", "+94", "+60", "+49"];

// Shared "meaningful value" check: rejects blank / symbols-only / numeric-only
// strings while allowing letters, digits and common punctuation (space / - , . #).
const MEANINGFUL_PATTERN = /^(?=.*[A-Za-z0-9])[A-Za-z0-9\s/\-,.#]+$/;
const meaningfulTest = (value) => {
  if (value == null || String(value).trim() === "") return true;
  return MEANINGFUL_PATTERN.test(String(value).trim());
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    fontSize: "0.75rem",
    borderRadius: 10,
    borderWidth: "1px",
    borderColor: state.isFocused ? "#1e88e5" : "#dbe3ef",
    backgroundColor: "#f8fbff",
    boxShadow: "none",
    "&:hover": { borderColor: state.isFocused ? "#1e88e5" : "#dbe3ef" },
  }),
  valueContainer: (base) => ({ ...base, fontSize: "0.75rem" }),
  singleValue: (base) => ({ ...base, fontSize: "0.75rem", fontWeight: 400 }),
  placeholder: (base) => ({ ...base, fontSize: "0.75rem" }),
  option: (base) => ({ ...base, fontSize: "0.75rem" }),
  menu: (base) => ({ ...base, zIndex: 20, borderRadius: 10, fontSize: "0.75rem" }),
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
  const [statesError, setStatesError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [districtsError, setDistrictsError] = useState("");
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState("");
  const [pincodes, setPincodes] = useState([]);
  const [pincodesLoading, setPincodesLoading] = useState(false);
  const [pincodesError, setPincodesError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [step3Attempted, setStep3Attempted] = useState(false);
  const [qualificationDoc, setQualificationDoc] = useState(null);
  const [registrationDoc, setRegistrationDoc] = useState(null);

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
      countryCode: "+91",
      mobileNo: "",
      userPassword: "",
      confirmPassword: "",
      companyName: "",
      countryId: 78,
      stateId: null,
      districtId: null,
      city: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      postalCode: "",
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
      countryCode: Yup.string()
        .matches(/^\+\d{1,6}$/, "Please select a valid country code")
        .required("Please select country code"),
      mobileNo: Yup.string()
        .trim()
        .required("Please enter mobile number")
        .test("mobile-format", "Please enter a valid mobile number", function (value) {
          const digits = String(value || "").replace(/[\s\-()]/g, "");
          if (!digits) return true;
          if ((this.parent?.countryCode || "+91") === "+91") {
            return /^[6-9]\d{9}$/.test(digits);
          }
          return /^[0-9]{7,15}$/.test(digits);
        }),
      userPassword: Yup.string().min(4, "Password must be at least 4 characters").required("Please enter password"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("userPassword")], "Passwords do not match")
        .required("Please confirm password"),
      companyName: Yup.string()
        .trim()
        .required("Please enter clinic / company name")
        .test(
          "clinic-name",
          "Please enter clinic / company name",
          (value) => {
            if (!value) return true;
            const v = String(value).trim();
            if (/^[0-9\s]+$/.test(v)) return false;
            return /^(?=.*[A-Za-z])[A-Za-z0-9\s.,'&\-()/#]+$/.test(v);
          }
        ),
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
      districtId: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null || originalValue === undefined ? null : value
        )
        .nullable(),
      city: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null || originalValue === undefined ? null : value
        )
        .nullable(),
      addressLine1: Yup.string()
        .trim()
        .test("address-line-1", "Please enter a valid address line", (value) => meaningfulTest(value)),
      addressLine2: Yup.string()
        .trim()
        .test("address-line-2", "Please enter a valid address line", (value) => meaningfulTest(value)),
      landmark: Yup.string()
        .trim()
        .test("landmark", "Please enter a valid landmark", (value) => meaningfulTest(value)),
      postalCode: Yup.string()
        .trim()
        .test("postal-code", "Please enter a valid PIN / ZIP code", function (value) {
          if (!value) return true;
          const v = String(value).trim();
          if (v.toLowerCase() === "other") return true;
          if (Number(this.parent?.countryId) === 78) {
            return /^\d{6}$/.test(v);
          }
          return /^[A-Za-z0-9\s\-]{3,10}$/.test(v);
        }),
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
      const formData = new FormData();
      formData.append("firstName", values.firstName.trim());
      formData.append("middleName", values.middleName?.trim() || "");
      formData.append("lastName", values.lastName.trim());
      formData.append("userName", values.userName.trim());
      formData.append("emailId", values.emailId.trim());
      const mobileDigits = String(values.mobileNo || "").replace(/[^\d]/g, "");
      const dialCode = String(values.countryCode || "+91").trim() || "+91";
      formData.append("mobileNo", `${dialCode}${mobileDigits}`);
      formData.append("userPassword", values.userPassword);
      formData.append("companyName", values.companyName.trim());
      formData.append("countryId", String(Number(values.countryId)));
      if (values.stateId) formData.append("stateId", String(Number(values.stateId)));
      const cityId = Number(values.city);
      const cityRow = Number.isFinite(cityId)
        ? cities.find((c) => Number(c.cityId ?? c.CityId ?? c.id ?? c.Id) === cityId)
        : null;
      formData.append(
        "city",
        String(cityRow?.cityName ?? cityRow?.CityName ?? cityRow?.name ?? cityRow?.Name ?? "").trim()
      );
      const addressParts = [
        values.addressLine1?.trim() || "",
        values.addressLine2?.trim() || "",
        values.landmark?.trim() || "",
        values.postalCode?.trim() || "",
      ].filter(Boolean);
      formData.append("permanantAddress", addressParts.join(", "));
      formData.append("qualificationId", String(Number(values.qualificationId)));
      formData.append("passingUniversity", values.passingUniversity?.trim() || "");
      formData.append("passingCertNo", values.passingCertNo?.trim() || "");
      if (qualificationDoc) formData.append("qualificationDoc", qualificationDoc);
      if (registrationDoc) formData.append("registrationDoc", registrationDoc);
      dispatch(registerUser(formData));
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

  const districtOptions = useMemo(() => {
    const seen = new Set();
    return (districts || [])
      .map((d) => ({
        value: Number(d.districtId ?? d.DistrictId ?? d.id ?? d.Id),
        label: d.districtName ?? d.DistrictName ?? d.name ?? d.Name,
      }))
      .filter((o) => Number.isFinite(o.value) && o.label && !seen.has(o.value) && (seen.add(o.value), true));
  }, [districts]);

  const cityOptions = useMemo(() => {
    const seen = new Set();
    return (cities || [])
      .map((c) => ({
        value: Number(c.cityId ?? c.CityId ?? c.id ?? c.Id),
        label: c.cityName ?? c.CityName ?? c.name ?? c.Name,
      }))
      .filter((o) => Number.isFinite(o.value) && o.label && !seen.has(o.value) && (seen.add(o.value), true));
  }, [cities]);

  const pincodeOptions = useMemo(() => {
    const seen = new Set();
    return (pincodes || [])
      .map((p) => String(p.pinCode ?? p.PinCode ?? "").trim())
      .filter((code) => code && !seen.has(code) && (seen.add(code), true))
      .map((code) => ({ value: code, label: code }));
  }, [pincodes]);

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

  // Step 1 dial-code options bound to the countries API response.
  const dialCodeOptions = useMemo(() => {
    const seen = new Map();
    (countries || []).forEach((c) => {
      const name = c.countryName ?? c.CountryName;
      const raw = c.countryCode ?? c.CountryCode;
      if (!name) return;
      splitDialCodes(raw).forEach((normalized, index) => {
        if (!seen.has(normalized)) {
          const original = String(raw).split(",")[index]?.trim() || normalized;
          seen.set(normalized, { value: normalized, label: `${name} (${original})` });
        }
      });
    });
    if (seen.size === 0) {
      return FALLBACK_DIAL_CODES.map((code) => ({ value: code, label: code }));
    }
    return [...seen.values()];
  }, [countries]);

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) {
      setStates([]);
      setStatesError("");
      return;
    }
    setStatesLoading(true);
    setStatesError("");
    try {
      const list = await getRegistrationStates(countryId);
      setStates(Array.isArray(list) ? list : []);
    } catch {
      setStates([]);
      setStatesError("Could not load states for the selected country. Please retry.");
    } finally {
      setStatesLoading(false);
    }
  }, []);

  const loadDistricts = useCallback(async (stateId) => {
    if (!stateId) {
      setDistricts([]);
      setDistrictsError("");
      return;
    }
    setDistrictsLoading(true);
    setDistrictsError("");
    try {
      const list = await getRegistrationDistricts(stateId);
      setDistricts(Array.isArray(list) ? list : []);
    } catch {
      setDistricts([]);
      setDistrictsError("Could not load districts for the selected state. Please retry.");
    } finally {
      setDistrictsLoading(false);
    }
  }, []);

  const loadCities = useCallback(async (districtId) => {
    if (!districtId) {
      setCities([]);
      setCitiesError("");
      return;
    }
    setCitiesLoading(true);
    setCitiesError("");
    try {
      const list = await getRegistrationCities(districtId);
      setCities(Array.isArray(list) ? list : []);
    } catch {
      setCities([]);
      setCitiesError("Could not load cities for the selected district. Please retry.");
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  const loadPinCodes = useCallback(async (cityId) => {
    if (!cityId) {
      setPincodes([]);
      setPincodesError("");
      return;
    }
    setPincodesLoading(true);
    setPincodesError("");
    try {
      const list = await getRegistrationPinCodes(cityId);
      setPincodes(Array.isArray(list) ? list : []);
    } catch {
      setPincodes([]);
      setPincodesError("Could not load PIN codes for the selected city. Please retry.");
    } finally {
      setPincodesLoading(false);
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
    if (validation.values.stateId) {
      loadDistricts(validation.values.stateId);
    } else {
      setDistricts([]);
      setDistrictsError("");
    }
  }, [validation.values.stateId, loadDistricts]);

  useEffect(() => {
    if (validation.values.districtId) {
      loadCities(validation.values.districtId);
    } else {
      setCities([]);
      setCitiesError("");
    }
  }, [validation.values.districtId, loadCities]);

  useEffect(() => {
    if (validation.values.city) {
      loadPinCodes(validation.values.city);
    } else {
      setPincodes([]);
      setPincodesError("");
    }
  }, [validation.values.city, loadPinCodes]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => {
      dispatch(resetRegisterFlag());
      navigate("/register/pending", {
        state: {
          registered: true,
          userName: user?.userName,
          notice:
            message ||
            "Account created. Check email to activate. Practice stays Pending until verification — it is not unlocked by a subscription package.",
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

  // Code -> country sync: selecting a dial code auto-selects the matching
  // Step 2 country (existing countryId effect then reloads its states).
  const handleDialCodeChange = (code) => {
    validation.setFieldValue("countryCode", code);
    validation.setFieldTouched("countryCode", true, false);
    validation.setFieldTouched("mobileNo", true, false);
    validation.validateField("mobileNo");
    const candidateIds = (countries || [])
      .map((c) => ({
        id: Number(c.countryId ?? c.CountryId),
        codes: splitDialCodes(c.countryCode ?? c.CountryCode),
      }))
      .filter((c) => Number.isFinite(c.id) && c.codes.includes(code))
      .map((c) => c.id);
    if (candidateIds.length === 0) return;
    if (candidateIds.includes(Number(validation.values.countryId))) return;
    validation.setFieldValue("countryId", [...candidateIds].sort((a, b) => a - b)[0]);
    validation.setFieldValue("stateId", null);
    validation.setFieldValue("districtId", null);
    validation.setFieldValue("city", "");
    validation.setFieldValue("postalCode", "");
  };  const selectedState =
    stateOptions.find((o) => Number(o.value) === Number(validation.values.stateId)) || null;
  const selectedDistrict =
    districtOptions.find((o) => Number(o.value) === Number(validation.values.districtId)) || null;
  const selectedCity =
    cityOptions.find((o) => Number(o.value) === Number(validation.values.city)) || null;
  const selectedPostalCode =
    pincodeOptions.find((o) => o.value === String(validation.values.postalCode || "")) || null;
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
                      <Link to="/" className="d-inline-block" title="Homeocentrum">
                        <img src={logoDark} alt="Homeocentrum" className="auth-signin-logo mb-3" height="38" />
                      </Link>
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
                          Next: check your email to activate. The practice stays Pending until verification — it is not unlocked by a subscription package.
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
                                <div className="d-flex gap-2">
                                  <div style={{ width: "9rem" }} className="flex-shrink-0">
                                    <Select
                                      inputId="countryCode"
                                      aria-label="Country code"
                                      options={dialCodeOptions}
                                      value={
                                        dialCodeOptions.find(
                                          (o) => o.value === validation.values.countryCode
                                        ) || null
                                      }
                                      isLoading={lookupsLoading}
                                      isDisabled={lookupsLoading}
                                      isSearchable
                                      placeholder={lookupsLoading ? "Loading…" : "Code"}
                                      noOptionsMessage={() => "No dial codes found."}
                                      styles={{
                                        ...selectStyles,
                                        menu: (base) => ({ ...base, width: "max-content", minWidth: "100%" }),
                                      }}
                                      onChange={(option) => handleDialCodeChange(option?.value || "")}
                                      onBlur={() => validation.setFieldTouched("countryCode", true)}
                                    />
                                  </div>
                                  <Input
                                    id="mobileNo"
                                    name="mobileNo"
                                    type="tel"
                                    className="flex-fill"
                                    style={{ minWidth: 0 }}
                                    placeholder="e.g. 9876543210"
                                    value={validation.values.mobileNo}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                      (validation.touched.mobileNo && !!validation.errors.mobileNo) ||
                                      (validation.touched.countryCode && !!validation.errors.countryCode)
                                    }
                                  />
                                </div>
                                {validation.touched.countryCode && validation.errors.countryCode ? (
                                  <div className="invalid-feedback d-block">{validation.errors.countryCode}</div>
                                ) : null}
                                {validation.touched.mobileNo && validation.errors.mobileNo ? (
                                  <FormFeedback type="invalid" className="d-block">{validation.errors.mobileNo}</FormFeedback>
                                ) : null}
                                <div className="form-text text-muted">
                                  Select the country code first — it sets the expected mobile format and selects the matching country below.
                                </div>
                              </Col>
                              <Col md={6} className="d-none d-md-block" />
                              <Col md={6}>
                                <Label htmlFor="userPassword" className="form-label">Password <span className="text-danger">*</span></Label>
                                <div className="auth-pass-inputgroup">
                                  <div className="auth-pass-inputgroup__control">
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
                                      className="auth-pass-inputgroup__toggle"
                                      type="button"
                                      onClick={() => setPasswordShow((v) => !v)}
                                      aria-label={passwordShow ? "Hide password" : "Show password"}
                                    >
                                      <i className={passwordShow ? "ri-eye-off-fill" : "ri-eye-fill"} aria-hidden="true" />
                                    </button>
                                  </div>
                                  {validation.touched.userPassword && validation.errors.userPassword ? (
                                    <FormFeedback type="invalid" className="d-block">
                                      {validation.errors.userPassword}
                                    </FormFeedback>
                                  ) : null}
                                </div>
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="confirmPassword" className="form-label">Confirm password <span className="text-danger">*</span></Label>
                                <div className="auth-pass-inputgroup">
                                  <div className="auth-pass-inputgroup__control">
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
                                      className="auth-pass-inputgroup__toggle"
                                      type="button"
                                      onClick={() => setConfirmPasswordShow((v) => !v)}
                                      aria-label={confirmPasswordShow ? "Hide password" : "Show password"}
                                    >
                                      <i className={confirmPasswordShow ? "ri-eye-off-fill" : "ri-eye-fill"} aria-hidden="true" />
                                    </button>
                                  </div>
                                  {validation.touched.confirmPassword && validation.errors.confirmPassword ? (
                                    <FormFeedback type="invalid" className="d-block">
                                      {validation.errors.confirmPassword}
                                    </FormFeedback>
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
                                  placeholder="Enter clinic or company name"
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
                                    validation.setFieldValue("districtId", null);
                                    validation.setFieldValue("city", "");
                                    validation.setFieldValue("postalCode", "");
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
                                  isDisabled={statesLoading}
                                  placeholder={statesLoading ? "Loading states…" : "Select state (optional)"}
                                  noOptionsMessage={() =>
                                    statesError
                                      ? "Could not load states. Please retry."
                                      : "No states found for this country."
                                  }
                                  styles={selectStyles}
                                  onChange={(option) => {
                                    validation.setFieldValue("stateId", option?.value || null);
                                    validation.setFieldValue("districtId", null);
                                    validation.setFieldValue("city", "");
                                    validation.setFieldValue("postalCode", "");
                                  }}
                                />
                                {statesError && !statesLoading ? (
                                  <div className="text-danger mt-1" style={{ fontSize: "0.75rem" }}>
                                    {statesError}{" "}
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 align-baseline"
                                      style={{ fontSize: "0.75rem" }}
                                      onClick={() => loadStates(validation.values.countryId)}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label className="form-label">District</Label>
                                <Select
                                  options={districtOptions}
                                  value={selectedDistrict}
                                  isLoading={districtsLoading}
                                  isClearable
                                  isDisabled={districtsLoading || !validation.values.stateId}
                                  placeholder={
                                    !validation.values.stateId
                                      ? "Select state first"
                                      : districtsLoading
                                        ? "Loading districts…"
                                        : "Select district (optional)"
                                  }
                                  noOptionsMessage={() =>
                                    districtsError
                                      ? "Could not load districts. Please retry."
                                      : "No districts found for this state."
                                  }
                                  styles={selectStyles}
                                  onChange={(option) => {
                                    validation.setFieldValue("districtId", option?.value || null);
                                    validation.setFieldValue("city", "");
                                    validation.setFieldValue("postalCode", "");
                                  }}
                                />
                                {districtsError && !districtsLoading ? (
                                  <div className="text-danger mt-1" style={{ fontSize: "0.75rem" }}>
                                    {districtsError}{" "}
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 align-baseline"
                                      style={{ fontSize: "0.75rem" }}
                                      onClick={() => loadDistricts(validation.values.stateId)}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="city" className="form-label">City</Label>
                                <Select
                                  inputId="city"
                                  options={cityOptions}
                                  value={selectedCity}
                                  isLoading={citiesLoading}
                                  isClearable
                                  isDisabled={citiesLoading || !validation.values.districtId}
                                  placeholder={
                                    !validation.values.districtId
                                      ? "Select district first"
                                      : citiesLoading
                                        ? "Loading cities…"
                                        : "Select city (optional)"
                                  }
                                  noOptionsMessage={() =>
                                    citiesError
                                      ? "Could not load cities. Please retry."
                                      : "No cities found for this district."
                                  }
                                  styles={selectStyles}
                                  onChange={(option) => {
                                    validation.setFieldValue("city", option?.value || "");
                                    validation.setFieldValue("postalCode", "");
                                  }}
                                  onBlur={() => validation.setFieldTouched("city", true)}
                                />
                                {validation.touched.city && validation.errors.city ? (
                                  <div className="invalid-feedback d-block">{validation.errors.city}</div>
                                ) : null}
                                {citiesError && !citiesLoading ? (
                                  <div className="text-danger mt-1" style={{ fontSize: "0.75rem" }}>
                                    {citiesError}{" "}
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 align-baseline"
                                      style={{ fontSize: "0.75rem" }}
                                      onClick={() => loadCities(validation.values.districtId)}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="addressLine1" className="form-label">Address line 1</Label>
                                <Input
                                  id="addressLine1"
                                  name="addressLine1"
                                  type="text"
                                  placeholder="Building / clinic name, street"
                                  value={validation.values.addressLine1}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.addressLine1 && !!validation.errors.addressLine1}
                                />
                                {validation.touched.addressLine1 && validation.errors.addressLine1 ? (
                                  <FormFeedback type="invalid">{validation.errors.addressLine1}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="addressLine2" className="form-label">Address line 2</Label>
                                <Input
                                  id="addressLine2"
                                  name="addressLine2"
                                  type="text"
                                  placeholder="Area / locality, apartment / floor"
                                  value={validation.values.addressLine2}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.addressLine2 && !!validation.errors.addressLine2}
                                />
                                {validation.touched.addressLine2 && validation.errors.addressLine2 ? (
                                  <FormFeedback type="invalid">{validation.errors.addressLine2}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="landmark" className="form-label">Landmark</Label>
                                <Input
                                  id="landmark"
                                  name="landmark"
                                  type="text"
                                  placeholder="Nearby identifiable landmark"
                                  value={validation.values.landmark}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={validation.touched.landmark && !!validation.errors.landmark}
                                />
                                {validation.touched.landmark && validation.errors.landmark ? (
                                  <FormFeedback type="invalid">{validation.errors.landmark}</FormFeedback>
                                ) : null}
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="postalCode" className="form-label">ZIP / PIN code</Label>
                                <Select
                                  inputId="postalCode"
                                  options={pincodeOptions}
                                  value={selectedPostalCode}
                                  isLoading={pincodesLoading}
                                  isClearable
                                  isDisabled={pincodesLoading || !validation.values.city}
                                  placeholder={
                                    !validation.values.city
                                      ? "Select city first"
                                      : pincodesLoading
                                        ? "Loading PIN codes…"
                                        : "Select PIN code (optional)"
                                  }
                                  noOptionsMessage={() =>
                                    pincodesError
                                      ? "Could not load PIN codes. Please retry."
                                      : "No PIN codes found for this city."
                                  }
                                  styles={selectStyles}
                                  onChange={(option) => validation.setFieldValue("postalCode", option?.value || "")}
                                  onBlur={() => validation.setFieldTouched("postalCode", true)}
                                />
                                {validation.touched.postalCode && validation.errors.postalCode ? (
                                  <div className="invalid-feedback d-block">{validation.errors.postalCode}</div>
                                ) : null}
                                {pincodesError && !pincodesLoading ? (
                                  <div className="text-danger mt-1" style={{ fontSize: "0.75rem" }}>
                                    {pincodesError}{" "}
                                    <button
                                      type="button"
                                      className="btn btn-link p-0 align-baseline"
                                      style={{ fontSize: "0.75rem" }}
                                      onClick={() => loadPinCodes(validation.values.city)}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                ) : null}
                              </Col>
                              <Col xs={12}>
                                <div className="form-text text-muted">
                                  Country follows the mobile country code selected in Step 1; you can still change it.
                                </div>
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
                              <Col md={6}>
                                <Label htmlFor="qualificationDoc" className="form-label">Qualification document</Label>
                                <Input
                                  id="qualificationDoc"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => setQualificationDoc(e.target.files?.[0] || null)}
                                />
                              </Col>
                              <Col md={6}>
                                <Label htmlFor="registrationDoc" className="form-label">Registration document</Label>
                                <Input
                                  id="registrationDoc"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => setRegistrationDoc(e.target.files?.[0] || null)}
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
                      <p className="mb-0 mt-2">
                        <Link to="/" className="fw-semibold text-primary text-decoration-underline">
                          Back to home
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
