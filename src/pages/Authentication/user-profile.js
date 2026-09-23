import React, { useState, useEffect, useRef } from "react";
import { isEmpty } from "lodash";
import classnames from "classnames";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Label,
  Input,
  FormFeedback,
  Form,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  UncontrolledTooltip,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import Swal from "sweetalert2";

import ModalActionButton from "../../Components/Common/ModalActionButton";
import { editProfile, resetProfileFlag } from "../../slices/thunks";
import { navigateToRoleDashboard } from "../../helpers/navigateToRoleDashboard";
import { UserRole } from "../../Components/constants/roles";
import avatar1 from "../../assets/images/users/avatar-1.jpg";

const PROFILE_TABS = [
  { id: "profile", label: "Profile" },
  { id: "clinic", label: "Clinic" },
  { id: "fees", label: "Fees" },
  { id: "photo", label: "Photo" },
  { id: "qualifications", label: "Qualifications" },
  { id: "hours", label: "Hours" },
  { id: "bank", label: "Bank" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const DEFAULT_CLINIC_FORM = {
  clinicName: "Homeocentrum Clinic",
  addressLine1: "123 MG Road",
  addressLine2: "Near City Hospital",
  city: "Bangalore",
  state: "Karnataka",
  pincode: "560001",
  contactNumber: "9876543210",
  email: "clinic@drnikhiljamdar.com",
  googleMapsLink: "https://maps.google.com/...",
};

const DEFAULT_FEES_FORM = {
  inClinic: {
    consultationFee: "800",
    followUpFee: "500",
    currency: "INR",
    freeFollowUpDays: "15",
  },
  tele: {
    enabled: true,
    consultationFee: "600",
    followUpFee: "400",
    currency: "INR",
    freeFollowUpDays: "10",
  },
};

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

const BANK_NAME_OPTIONS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank of India",
  "Yes Bank",
];

const ACCOUNT_TYPE_OPTIONS = ["Savings", "Current"];

const DEFAULT_BANK_FORM = {
  accountHolderName: "Dr. Nikhil Jamdar",
  bankName: "HDFC Bank",
  accountNumber: "50100123456789",
  confirmAccountNumber: "50100123456789",
  ifscCode: "HDFC0001234",
  branchName: "MG Road, Bangalore",
  accountType: "Savings",
};

const DEGREE_OPTIONS = ["BHMS", "MD", "BAMS", "DHMS", "MBBS", "PhD", "Other"];

const EMPTY_QUALIFICATION_FORM = {
  degree: "",
  specialization: "",
  institution: "",
  year: "",
  documentName: "",
  documentUrl: "",
};

const INITIAL_QUALIFICATIONS = [
  {
    id: 1,
    degree: "BHMS",
    specialization: "Homoeopathy",
    institution: "ABC College",
    year: "2010",
    documentName: "bhms-certificate.pdf",
    documentUrl: "#",
  },
  {
    id: 2,
    degree: "MD",
    specialization: "Homoeopathy",
    institution: "XYZ University",
    year: "2014",
    documentName: "md-certificate.pdf",
    documentUrl: "#",
  },
];

const QUALIFICATION_YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 1979 },
  (_, index) => String(new Date().getFullYear() - index)
);

const WEEK_DAYS = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
];

const HOUR_TIME_OPTIONS = [
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
];

const createDefaultHoursDay = (overrides = {}) => ({
  available: true,
  startTime: "09:00 AM",
  endTime: "01:00 PM",
  breakEnabled: false,
  breakFrom: "01:00 PM",
  breakTo: "02:00 PM",
  ...overrides,
});

const INITIAL_HOURS_SCHEDULE = {
  monday: createDefaultHoursDay(),
  tuesday: createDefaultHoursDay(),
  wednesday: createDefaultHoursDay({ breakEnabled: true, breakFrom: "01:00 PM", breakTo: "02:00 PM" }),
  thursday: createDefaultHoursDay(),
  friday: createDefaultHoursDay(),
  saturday: createDefaultHoursDay({
    startTime: "10:00 AM",
    endTime: "02:00 PM",
    breakEnabled: true,
    breakFrom: "01:00 PM",
    breakTo: "01:30 PM",
  }),
  sunday: createDefaultHoursDay({
    available: false,
    startTime: "",
    endTime: "",
    breakEnabled: false,
    breakFrom: "",
    breakTo: "",
  }),
};

const INITIAL_CONSULTATION_MODE = {
  inClinic: true,
  teleconsultation: true,
  both: false,
};

const ProfileBadge = ({ tone = "neutral", children }) => (
  <span className={`user-profile-page__badge user-profile-page__badge--${tone}`}>
    {children}
  </span>
);

const ProfileInfoField = ({ icon, label, children }) => (
  <Col lg={4} md={6} xs={12}>
    <div className="user-profile-page__field">
      <Label className="form-label new-patient-modal__label">
        <i className={icon} aria-hidden="true" />
        {label}
      </Label>
      <div className="user-profile-page__value">{children}</div>
    </div>
  </Col>
);

const RequiredMark = () => <span className="text-danger"> *</span>;

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [email, setemail] = useState("admin@gmail.com");
  const [idx, setidx] = useState("1");
  const [userName, setUserName] = useState("Admin");
  const [activeTab, setActiveTab] = useState("clinic");
  const [clinicForm, setClinicForm] = useState(DEFAULT_CLINIC_FORM);
  const [feesForm, setFeesForm] = useState(DEFAULT_FEES_FORM);
  const [profilePhoto, setProfilePhoto] = useState(avatar1);
  const [photoFileInputKey, setPhotoFileInputKey] = useState(0);
  const photoInputRef = useRef(null);
  const [qualifications, setQualifications] = useState(INITIAL_QUALIFICATIONS);
  const [qualificationForm, setQualificationForm] = useState(EMPTY_QUALIFICATION_FORM);
  const [editingQualificationId, setEditingQualificationId] = useState(null);
  const [qualificationFileKey, setQualificationFileKey] = useState(0);
  const qualificationFileRef = useRef(null);
  const [hoursSchedule, setHoursSchedule] = useState(INITIAL_HOURS_SCHEDULE);
  const [applyToDays, setApplyToDays] = useState(() =>
    WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day.id]: day.id !== "sunday" }), {})
  );
  const [consultationMode, setConsultationMode] = useState(INITIAL_CONSULTATION_MODE);
  const [bankForm, setBankForm] = useState(DEFAULT_BANK_FORM);

  const selectLayoutState = (state) => state.Profile;
  const userprofileData = createSelector(selectLayoutState, (state) => ({
    user: state.user,
    success: state.success,
    error: state.error,
  }));

  const { user, success, error } = useSelector(userprofileData);

  useEffect(() => {
    const authUserStr = sessionStorage.getItem("authUser");
    if (authUserStr) {
      try {
        const obj = JSON.parse(authUserStr);
        const userInfo = obj.data || obj;

        if (userInfo) {
          setUserData(userInfo);
          setUserName(userInfo.userName || "Admin");
          setemail(userInfo.email || "N/A");
          setidx(userInfo.userId || userInfo._id || "1");

          if (!isEmpty(user)) {
            const updatedObj = { ...obj };
            if (updatedObj.data) {
              updatedObj.data.first_name = user.first_name;
            } else {
              updatedObj.first_name = user.first_name;
            }
            sessionStorage.setItem("authUser", JSON.stringify(updatedObj));
          }
        }

        setTimeout(() => {
          dispatch(resetProfileFlag());
        }, 3000);
      } catch (parseError) {
        console.error("Error parsing authUser:", parseError);
      }
    }
  }, [dispatch, user]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: userName || "Admin",
      idx: idx || "",
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required("Please Enter Your UserName"),
    }),
    onSubmit: (values) => {
      dispatch(editProfile(values));
    },
  });

  const handleBackToDashboard = () => {
    navigateToRoleDashboard(navigate);
  };

  const getDaysRemainingTone = (days) => {
    if (days > 7) return "success";
    if (days > 3) return "warning";
    return "danger";
  };

  const updateClinicField = (field, value) => {
    setClinicForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateFeesSection = (section, field, value) => {
    setFeesForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveClinic = (event) => {
    event.preventDefault();
    if (
      !clinicForm.clinicName.trim() ||
      !clinicForm.addressLine1.trim() ||
      !clinicForm.city.trim() ||
      !clinicForm.state.trim() ||
      !clinicForm.pincode.trim()
    ) {
      Swal.fire({
        title: "Missing details",
        text: "Please fill all required clinic fields.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Saved!",
      text: "Clinic information has been updated for Dr. Nikhil Jamdar.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSaveFees = (event) => {
    event.preventDefault();
    if (!String(feesForm.inClinic.consultationFee || "").trim()) {
      Swal.fire({
        title: "Missing details",
        text: "Please enter the in-clinic consultation fee.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }
    if (feesForm.tele.enabled && !String(feesForm.tele.consultationFee || "").trim()) {
      Swal.fire({
        title: "Missing details",
        text: "Please enter the teleconsultation fee.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Saved!",
      text: "Consultation fees have been updated for Dr. Nikhil Jamdar.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleChangePhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        title: "Unsupported format",
        text: "Please upload a JPG or PNG image.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      setPhotoFileInputKey((key) => key + 1);
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      Swal.fire({
        title: "File too large",
        text: "Maximum size is 5 MB.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      setPhotoFileInputKey((key) => key + 1);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setProfilePhoto((prev) => {
      if (prev && prev !== avatar1 && typeof prev === "string" && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  };

  const handleRemovePhoto = () => {
    setProfilePhoto((prev) => {
      if (prev && prev !== avatar1 && typeof prev === "string" && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return avatar1;
    });
    setPhotoFileInputKey((key) => key + 1);
    Swal.fire({
      title: "Removed",
      text: "Profile photo reset to default.",
      icon: "success",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleSavePhoto = (event) => {
    event.preventDefault();
    Swal.fire({
      title: "Saved!",
      text: "Doctor profile photo has been updated.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const updateQualificationField = (field, value) => {
    setQualificationForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetQualificationForm = () => {
    setQualificationForm(EMPTY_QUALIFICATION_FORM);
    setEditingQualificationId(null);
    setQualificationFileKey((key) => key + 1);
  };

  const handleQualificationFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        title: "Unsupported format",
        text: "Please upload a PDF, JPG, or PNG file.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      setQualificationFileKey((key) => key + 1);
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      Swal.fire({
        title: "File too large",
        text: "Maximum size is 5 MB.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      setQualificationFileKey((key) => key + 1);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setQualificationForm((prev) => {
      if (prev.documentUrl && prev.documentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(prev.documentUrl);
      }
      return {
        ...prev,
        documentName: file.name,
        documentUrl: objectUrl,
      };
    });
  };

  const handleSaveQualifications = (event) => {
    event.preventDefault();
    Swal.fire({
      title: "Saved!",
      text: "Qualifications have been updated for Dr. Nikhil Jamdar.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleAddOrUpdateQualification = (event) => {
    event.preventDefault();
    if (
      !qualificationForm.degree.trim() ||
      !qualificationForm.institution.trim() ||
      !qualificationForm.year.trim()
    ) {
      Swal.fire({
        title: "Missing details",
        text: "Please fill degree, institution, and year of completion.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    if (editingQualificationId != null) {
      setQualifications((prev) =>
        prev.map((item) =>
          item.id === editingQualificationId
            ? {
                ...item,
                degree: qualificationForm.degree.trim(),
                specialization: qualificationForm.specialization.trim() || "—",
                institution: qualificationForm.institution.trim(),
                year: qualificationForm.year.trim(),
                documentName: qualificationForm.documentName || item.documentName,
                documentUrl: qualificationForm.documentUrl || item.documentUrl,
              }
            : item
        )
      );
      resetQualificationForm();
      Swal.fire({
        title: "Updated!",
        text: "Qualification has been updated.",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });
      return;
    }

    const nextId = qualifications.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    setQualifications((prev) => [
      ...prev,
      {
        id: nextId,
        degree: qualificationForm.degree.trim(),
        specialization: qualificationForm.specialization.trim() || "—",
        institution: qualificationForm.institution.trim(),
        year: qualificationForm.year.trim(),
        documentName: qualificationForm.documentName || "",
        documentUrl: qualificationForm.documentUrl || "#",
      },
    ]);
    resetQualificationForm();
    Swal.fire({
      title: "Added!",
      text: "Qualification has been added.",
      icon: "success",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleEditQualification = (item) => {
    setEditingQualificationId(item.id);
    setQualificationForm({
      degree: item.degree || "",
      specialization: item.specialization === "—" ? "" : item.specialization || "",
      institution: item.institution || "",
      year: item.year || "",
      documentName: item.documentName || "",
      documentUrl: item.documentUrl || "",
    });
    setQualificationFileKey((key) => key + 1);
  };

  const handleDeleteQualification = (item) => {
    Swal.fire({
      title: "Are you sure you want to delete this qualification?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (!result.isConfirmed) return;
      setQualifications((prev) => prev.filter((row) => row.id !== item.id));
      if (editingQualificationId === item.id) {
        resetQualificationForm();
      }
      Swal.fire({
        title: "Deleted!",
        text: "Qualification has been deleted.",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });
    });
  };

  const handleViewQualificationDocument = (item) => {
    if (!item.documentUrl || item.documentUrl === "#") {
      Swal.fire({
        title: "No document",
        text: "No certificate file is attached for this qualification.",
        icon: "info",
        timer: 1600,
        showConfirmButton: false,
      });
      return;
    }
    window.open(item.documentUrl, "_blank", "noopener,noreferrer");
  };

  const updateHoursDay = (dayId, field, value) => {
    setHoursSchedule((prev) => {
      const current = prev[dayId] || createDefaultHoursDay();
      const nextDay = { ...current, [field]: value };

      if (field === "available" && !value) {
        nextDay.startTime = "";
        nextDay.endTime = "";
        nextDay.breakEnabled = false;
        nextDay.breakFrom = "";
        nextDay.breakTo = "";
      }

      if (field === "available" && value) {
        nextDay.startTime = current.startTime || "09:00 AM";
        nextDay.endTime = current.endTime || "01:00 PM";
      }

      if (field === "breakEnabled" && value) {
        nextDay.breakFrom = current.breakFrom || "01:00 PM";
        nextDay.breakTo = current.breakTo || "02:00 PM";
      }

      if (field === "breakEnabled" && !value) {
        nextDay.breakFrom = "";
        nextDay.breakTo = "";
      }

      return { ...prev, [dayId]: nextDay };
    });
  };

  const toggleApplyDay = (dayId) => {
    setApplyToDays((prev) => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const handleApplyHoursToSelectedDays = () => {
    const selectedDayIds = WEEK_DAYS.map((day) => day.id).filter((dayId) => applyToDays[dayId]);
    if (selectedDayIds.length === 0) {
      Swal.fire({
        title: "Select days",
        text: "Please select at least one day to apply.",
        icon: "warning",
        timer: 1600,
        showConfirmButton: false,
      });
      return;
    }

    const sourceDay =
      hoursSchedule.monday?.available
        ? hoursSchedule.monday
        : WEEK_DAYS.map((day) => hoursSchedule[day.id]).find((day) => day?.available) ||
          createDefaultHoursDay();

    setHoursSchedule((prev) => {
      const next = { ...prev };
      selectedDayIds.forEach((dayId) => {
        next[dayId] = {
          ...sourceDay,
          available: true,
          startTime: sourceDay.startTime || "09:00 AM",
          endTime: sourceDay.endTime || "01:00 PM",
          breakEnabled: Boolean(sourceDay.breakEnabled),
          breakFrom: sourceDay.breakEnabled ? sourceDay.breakFrom || "01:00 PM" : "",
          breakTo: sourceDay.breakEnabled ? sourceDay.breakTo || "02:00 PM" : "",
        };
      });
      return next;
    });

    Swal.fire({
      title: "Applied",
      text: "Selected days were updated from the Monday schedule.",
      icon: "success",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const updateConsultationMode = (field) => {
    setConsultationMode((prev) => {
      if (field === "both") {
        const nextBoth = !prev.both;
        return {
          inClinic: nextBoth ? true : prev.inClinic,
          teleconsultation: nextBoth ? true : prev.teleconsultation,
          both: nextBoth,
        };
      }

      return {
        ...prev,
        [field]: !prev[field],
        both: false,
      };
    });
  };

  const handleSaveHours = (event) => {
    event.preventDefault();
    if (!consultationMode.inClinic && !consultationMode.teleconsultation) {
      Swal.fire({
        title: "Select consultation mode",
        text: "Please enable In-Clinic, Teleconsultation, or Both.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Saved!",
      text: "Clinic hours have been updated for Dr. Nikhil Jamdar.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const updateBankField = (field, value) => {
    setBankForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBank = (event) => {
    event.preventDefault();
    if (
      !bankForm.accountHolderName.trim() ||
      !bankForm.bankName.trim() ||
      !bankForm.accountNumber.trim() ||
      !bankForm.confirmAccountNumber.trim() ||
      !bankForm.ifscCode.trim() ||
      !bankForm.accountType.trim()
    ) {
      Swal.fire({
        title: "Missing details",
        text: "Please fill all required bank fields.",
        icon: "warning",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    if (bankForm.accountNumber.trim() !== bankForm.confirmAccountNumber.trim()) {
      Swal.fire({
        title: "Account numbers do not match",
        text: "Please confirm the account number carefully.",
        icon: "warning",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Saved!",
      text: "Bank details have been updated for Dr. Nikhil Jamdar.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const renderHoursTimeSelect = (dayId, field, value, disabled) => (
    <Input
      type="select"
      bsSize="sm"
      className="user-profile-page__hours-time-select"
      disabled={disabled}
      value={disabled ? "" : value || ""}
      onChange={(e) => updateHoursDay(dayId, field, e.target.value)}
    >
      <option value="">{disabled ? "--" : "Select"}</option>
      {HOUR_TIME_OPTIONS.map((time) => (
        <option key={`${dayId}-${field}-${time}`} value={time}>
          {time}
        </option>
      ))}
    </Input>
  );

  const displayName =
    userData?.role === UserRole.DOCTOR
      ? `Dr. ${String(userName || "Nikhil Jamdar")
          .replace(/^dr\.?\s*/i, "")
          .trim()}`
      : userName || "Admin";

  document.title = "Profile | Niga Homeocentrum";

  return (
    <div className="page-content user-profile-page doctor-dashboard-page">
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="user-profile-card doctor-stats-card">
              <CardBody className="user-profile-card__body">
                {error ? <Alert color="danger" className="mb-3">{error}</Alert> : null}
                {success ? (
                  <Alert color="success" className="mb-3">
                    Username updated to {userName}
                  </Alert>
                ) : null}

                <div className="user-profile-page__summary">
                  <span className="user-profile-page__avatar" aria-hidden="true">
                    <i className="ri-user-heart-line" />
                  </span>
                  <div className="min-w-0">
                    <h5 className="user-profile-page__summary-name text-truncate">
                      {displayName}
                    </h5>
                    <p className="user-profile-page__summary-meta">
                      <i className="ri-mail-line" aria-hidden="true" />
                      <span>Email: {email}</span>
                    </p>
                    <p className="user-profile-page__summary-meta mb-0">
                      <i className="ri-hashtag" aria-hidden="true" />
                      <span>User ID: #{idx}</span>
                    </p>
                  </div>
                </div>

                <Nav
                  tabs
                  className="nav-tabs-custom rounded border-bottom-0 user-profile-page__tabs"
                  role="tablist"
                >
                  {PROFILE_TABS.map((tab) => (
                    <NavItem key={tab.id}>
                      <NavLink
                        className={classnames({ active: activeTab === tab.id })}
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveTab(tab.id);
                        }}
                      >
                        {tab.label}
                      </NavLink>
                    </NavItem>
                  ))}
                </Nav>

                <TabContent activeTab={activeTab} className="user-profile-page__tab-content pt-3">
                  <TabPane tabId="profile">
                    {userData ? (
                      <>
                        <h5 className="user-profile-page__section-title">
                          <i className="ri-information-line" aria-hidden="true" />
                          User Information
                        </h5>
                        <Row className="g-3 new-patient-modal__fields user-profile-page__info-grid">
                          <ProfileInfoField icon="ri-user-line" label="Full Name">
                            {userData.userName || "N/A"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-user-3-line" label="First Name">
                            {userData.firstName || "N/A"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-user-4-line" label="Last Name">
                            {userData.lastName || "N/A"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-shield-user-line" label="Role">
                            <ProfileBadge tone="info">{userData.role || "N/A"}</ProfileBadge>
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-key-line" label="Role ID">
                            {userData.roleId || "N/A"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-fingerprint-line" label="User ID">
                            #{userData.userId || "N/A"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-vip-crown-line" label="Super User">
                            <ProfileBadge tone={userData.isSuperUser ? "success" : "neutral"}>
                              {userData.isSuperUser ? "Yes" : "No"}
                            </ProfileBadge>
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-checkbox-circle-line" label="Plan Status">
                            <ProfileBadge tone={userData.isPlanActive ? "success" : "danger"}>
                              {userData.isPlanActive ? "Active" : "Inactive"}
                            </ProfileBadge>
                          </ProfileInfoField>
                          {userData.daysRemaining !== undefined ? (
                            <ProfileInfoField icon="ri-timer-line" label="Days Remaining">
                              <ProfileBadge tone={getDaysRemainingTone(userData.daysRemaining)}>
                                {userData.daysRemaining} days
                              </ProfileBadge>
                            </ProfileInfoField>
                          ) : null}
                          {userData.firmIds ? (
                            <ProfileInfoField icon="ri-building-line" label="Firm IDs">
                              {userData.firmIds}
                            </ProfileInfoField>
                          ) : null}
                        </Row>
                      </>
                    ) : null}

                    <div className="user-profile-page__divider" />

                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      <div className="user-profile-page__row-section">
                        <h5 className="user-profile-page__section-title">
                          <i className="ri-edit-line" aria-hidden="true" />
                          Change User Name
                        </h5>
                        <Row className="g-3 new-patient-modal__fields">
                          <Col xs={12}>
                            <Label htmlFor="profileUserName" className="form-label new-patient-modal__label">
                              <i className="ri-user-line" aria-hidden="true" />
                              User Name
                            </Label>
                            <Input
                              id="profileUserName"
                              name="first_name"
                              className="form-control"
                              placeholder="Enter user name"
                              type="text"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.first_name || ""}
                              invalid={Boolean(validation.touched.first_name && validation.errors.first_name)}
                            />
                            {validation.touched.first_name && validation.errors.first_name ? (
                              <FormFeedback type="invalid">{validation.errors.first_name}</FormFeedback>
                            ) : null}
                            <Input name="idx" value={idx} type="hidden" />
                          </Col>
                        </Row>
                      </div>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>

                  <TabPane tabId="clinic">
                    <Form onSubmit={handleSaveClinic}>
                      <h5 className="user-profile-page__section-title">
                        <i className="ri-hospital-line" aria-hidden="true" />
                        Clinic Information
                      </h5>
                      <p className="text-muted small mb-3">
                        Managing clinic details for <strong>Dr. Nikhil Jamdar</strong>
                      </p>

                      <Row className="g-3 new-patient-modal__fields">
                        <Col xs={12}>
                          <Label htmlFor="clinicName" className="form-label new-patient-modal__label">
                            Clinic Name
                            <RequiredMark />
                          </Label>
                          <Input
                            id="clinicName"
                            type="text"
                            value={clinicForm.clinicName}
                            onChange={(e) => updateClinicField("clinicName", e.target.value)}
                          />
                        </Col>

                        <Col md={6} xs={12}>
                          <Label htmlFor="addressLine1" className="form-label new-patient-modal__label">
                            Address Line 1
                            <RequiredMark />
                          </Label>
                          <Input
                            id="addressLine1"
                            type="text"
                            value={clinicForm.addressLine1}
                            onChange={(e) => updateClinicField("addressLine1", e.target.value)}
                          />
                        </Col>
                        <Col md={6} xs={12}>
                          <Label htmlFor="addressLine2" className="form-label new-patient-modal__label">
                            Address Line 2
                          </Label>
                          <Input
                            id="addressLine2"
                            type="text"
                            value={clinicForm.addressLine2}
                            onChange={(e) => updateClinicField("addressLine2", e.target.value)}
                          />
                        </Col>

                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicCity" className="form-label new-patient-modal__label">
                            City
                            <RequiredMark />
                          </Label>
                          <Input
                            id="clinicCity"
                            type="text"
                            value={clinicForm.city}
                            onChange={(e) => updateClinicField("city", e.target.value)}
                          />
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicState" className="form-label new-patient-modal__label">
                            State
                            <RequiredMark />
                          </Label>
                          <Input
                            id="clinicState"
                            type="select"
                            value={clinicForm.state}
                            onChange={(e) => updateClinicField("state", e.target.value)}
                          >
                            {INDIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </Input>
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicPincode" className="form-label new-patient-modal__label">
                            Pincode
                            <RequiredMark />
                          </Label>
                          <Input
                            id="clinicPincode"
                            type="text"
                            value={clinicForm.pincode}
                            onChange={(e) => updateClinicField("pincode", e.target.value)}
                          />
                        </Col>

                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicContact" className="form-label new-patient-modal__label">
                            Contact Number
                          </Label>
                          <Input
                            id="clinicContact"
                            type="text"
                            value={clinicForm.contactNumber}
                            onChange={(e) => updateClinicField("contactNumber", e.target.value)}
                          />
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicEmail" className="form-label new-patient-modal__label">
                            Email
                          </Label>
                          <Input
                            id="clinicEmail"
                            type="email"
                            value={clinicForm.email}
                            onChange={(e) => updateClinicField("email", e.target.value)}
                          />
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicMaps" className="form-label new-patient-modal__label">
                            Google Maps Link
                          </Label>
                          <Input
                            id="clinicMaps"
                            type="text"
                            value={clinicForm.googleMapsLink}
                            onChange={(e) => updateClinicField("googleMapsLink", e.target.value)}
                          />
                        </Col>
                      </Row>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>

                  <TabPane tabId="fees">
                    <Form onSubmit={handleSaveFees}>
                      <h5 className="user-profile-page__section-title">
                        <i className="ri-money-rupee-circle-line" aria-hidden="true" />
                        Consultation Fees
                      </h5>

                      <div className="user-profile-page__fee-block">
                        <div className="user-profile-page__fee-block-header">
                          <h6 className="user-profile-page__fee-block-title mb-0">
                            <i className="ri-building-line" aria-hidden="true" />
                            In-Clinic Consultation
                          </h6>
                        </div>
                        <Row className="g-3 new-patient-modal__fields">
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="inClinicConsultationFee" className="form-label new-patient-modal__label">
                              Consultation Fee
                              <RequiredMark />
                            </Label>
                            <Input
                              id="inClinicConsultationFee"
                              type="number"
                              min="0"
                              value={feesForm.inClinic.consultationFee}
                              onChange={(e) => updateFeesSection("inClinic", "consultationFee", e.target.value)}
                            />
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="inClinicFollowUpFee" className="form-label new-patient-modal__label">
                              Follow-up Fee
                            </Label>
                            <Input
                              id="inClinicFollowUpFee"
                              type="number"
                              min="0"
                              value={feesForm.inClinic.followUpFee}
                              onChange={(e) => updateFeesSection("inClinic", "followUpFee", e.target.value)}
                            />
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="inClinicCurrency" className="form-label new-patient-modal__label">
                              Currency
                            </Label>
                            <Input
                              id="inClinicCurrency"
                              type="select"
                              value={feesForm.inClinic.currency}
                              onChange={(e) => updateFeesSection("inClinic", "currency", e.target.value)}
                            >
                              {CURRENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Input>
                          </Col>
                        </Row>
                        <div className="user-profile-page__fee-validity">
                          <span className="user-profile-page__fee-validity-label">
                            <i className="ri-calendar-check-line" aria-hidden="true" />
                            Free Follow-up Validity (Days)
                          </span>
                          <Input
                            type="number"
                            min="0"
                            className="user-profile-page__fee-validity-input"
                            value={feesForm.inClinic.freeFollowUpDays}
                            onChange={(e) => updateFeesSection("inClinic", "freeFollowUpDays", e.target.value)}
                            aria-label="In-clinic free follow-up validity days"
                          />
                        </div>
                      </div>

                      <div className="user-profile-page__fee-block">
                        <div className="user-profile-page__fee-block-header">
                          <h6 className="user-profile-page__fee-block-title mb-0">
                            <i className="ri-vidicon-line" aria-hidden="true" />
                            Teleconsultation
                          </h6>
                          <div className="form-check form-switch form-switch-success mb-0 user-profile-page__fee-switch">
                            <Input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="teleconsultationEnabled"
                              checked={feesForm.tele.enabled}
                              onChange={(e) => updateFeesSection("tele", "enabled", e.target.checked)}
                            />
                            <Label className="form-check-label" htmlFor="teleconsultationEnabled">
                              {feesForm.tele.enabled ? "Enabled" : "Disabled"}
                            </Label>
                          </div>
                        </div>
                        <Row className="g-3 new-patient-modal__fields">
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="teleConsultationFee" className="form-label new-patient-modal__label">
                              Consultation Fee
                              <RequiredMark />
                            </Label>
                            <Input
                              id="teleConsultationFee"
                              type="number"
                              min="0"
                              disabled={!feesForm.tele.enabled}
                              value={feesForm.tele.consultationFee}
                              onChange={(e) => updateFeesSection("tele", "consultationFee", e.target.value)}
                            />
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="teleFollowUpFee" className="form-label new-patient-modal__label">
                              Follow-up Fee
                            </Label>
                            <Input
                              id="teleFollowUpFee"
                              type="number"
                              min="0"
                              disabled={!feesForm.tele.enabled}
                              value={feesForm.tele.followUpFee}
                              onChange={(e) => updateFeesSection("tele", "followUpFee", e.target.value)}
                            />
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="teleCurrency" className="form-label new-patient-modal__label">
                              Currency
                            </Label>
                            <Input
                              id="teleCurrency"
                              type="select"
                              disabled={!feesForm.tele.enabled}
                              value={feesForm.tele.currency}
                              onChange={(e) => updateFeesSection("tele", "currency", e.target.value)}
                            >
                              {CURRENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Input>
                          </Col>
                        </Row>
                        <div className={`user-profile-page__fee-validity${!feesForm.tele.enabled ? " is-disabled" : ""}`}>
                          <span className="user-profile-page__fee-validity-label">
                            <i className="ri-calendar-check-line" aria-hidden="true" />
                            Free Follow-up Validity (Days)
                          </span>
                          <Input
                            type="number"
                            min="0"
                            className="user-profile-page__fee-validity-input"
                            disabled={!feesForm.tele.enabled}
                            value={feesForm.tele.freeFollowUpDays}
                            onChange={(e) => updateFeesSection("tele", "freeFollowUpDays", e.target.value)}
                            aria-label="Teleconsultation free follow-up validity days"
                          />
                        </div>
                      </div>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>
                  <TabPane tabId="photo">
                    <Form onSubmit={handleSavePhoto}>
                      <div className="user-profile-page__photo-card">
                        <h5 className="user-profile-page__section-title mb-4">
                          <i className="ri-camera-line" aria-hidden="true" />
                          Doctor Profile Photo
                        </h5>

                        <div className="user-profile-page__photo-body text-center">
                          <div className="user-profile-page__photo-preview-wrap">
                            <img
                              src={profilePhoto || avatar1}
                              alt="Doctor profile"
                              className="user-profile-page__photo-preview"
                            />
                          </div>

                          <input
                            key={photoFileInputKey}
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="d-none"
                            onChange={handlePhotoFileChange}
                          />

                          <div className="user-profile-page__photo-actions">
                            <button
                              type="button"
                              className="btn user-profile-page__photo-change-btn"
                              onClick={handleChangePhotoClick}
                            >
                              <i className="ri-upload-2-line" aria-hidden="true" />
                              <span>Change Photo</span>
                            </button>
                            <button
                              type="button"
                              className="btn user-profile-page__photo-remove-btn"
                              onClick={handleRemovePhoto}
                            >
                              <i className="ri-delete-bin-line" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <p className="user-profile-page__photo-help mb-0">
                            Supported formats: JPG, PNG
                            <br />
                            Maximum size: 5 MB
                          </p>
                        </div>
                      </div>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>
                  <TabPane tabId="qualifications">
                    <Form onSubmit={handleSaveQualifications}>
                      <h5 className="user-profile-page__section-title">
                        <i className="ri-award-line" aria-hidden="true" />
                        Qualifications
                      </h5>

                      <div className="user-profile-page__qualification-form">
                        <Row className="g-3 new-patient-modal__fields">
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="qualificationDegree" className="form-label new-patient-modal__label">
                              Degree
                              <RequiredMark />
                            </Label>
                            <Input
                              id="qualificationDegree"
                              type="select"
                              value={qualificationForm.degree}
                              onChange={(e) => updateQualificationField("degree", e.target.value)}
                            >
                              <option value="">Select degree</option>
                              {DEGREE_OPTIONS.map((degree) => (
                                <option key={degree} value={degree}>
                                  {degree}
                                </option>
                              ))}
                            </Input>
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="qualificationSpecialization" className="form-label new-patient-modal__label">
                              Specialization
                            </Label>
                            <Input
                              id="qualificationSpecialization"
                              type="text"
                              placeholder="Enter specialization"
                              value={qualificationForm.specialization}
                              onChange={(e) => updateQualificationField("specialization", e.target.value)}
                            />
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="qualificationInstitution" className="form-label new-patient-modal__label">
                              Institution / University
                              <RequiredMark />
                            </Label>
                            <Input
                              id="qualificationInstitution"
                              type="text"
                              placeholder="Enter institution name"
                              value={qualificationForm.institution}
                              onChange={(e) => updateQualificationField("institution", e.target.value)}
                            />
                          </Col>
                          <Col lg={4} md={6} xs={12}>
                            <Label htmlFor="qualificationYear" className="form-label new-patient-modal__label">
                              Year of Completion
                              <RequiredMark />
                            </Label>
                            <Input
                              id="qualificationYear"
                              type="select"
                              value={qualificationForm.year}
                              onChange={(e) => updateQualificationField("year", e.target.value)}
                            >
                              <option value="">Select year</option>
                              {QUALIFICATION_YEAR_OPTIONS.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </Input>
                          </Col>
                          <Col lg={8} md={6} xs={12}>
                            <Label htmlFor="qualificationDocument" className="form-label new-patient-modal__label">
                              Certificate / Document
                            </Label>
                            <div className="user-profile-page__qualification-file">
                              <button
                                type="button"
                                className="btn btn-sm user-profile-page__qualification-file-btn"
                                onClick={() => qualificationFileRef.current?.click()}
                              >
                                Choose File
                              </button>
                              <span className="user-profile-page__qualification-file-name text-muted">
                                {qualificationForm.documentName || "No file chosen"}
                              </span>
                              <input
                                key={qualificationFileKey}
                                ref={qualificationFileRef}
                                id="qualificationDocument"
                                type="file"
                                accept=".pdf,image/jpeg,image/jpg,image/png"
                                className="d-none"
                                onChange={handleQualificationFileChange}
                              />
                            </div>
                            <small className="text-muted d-block mt-1">PDF, JPG, PNG (Max 5 MB)</small>
                          </Col>
                        </Row>

                        <div className="user-profile-page__qualification-actions">
                          {editingQualificationId != null ? (
                            <ModalActionButton action="cancel" type="button" onClick={resetQualificationForm}>
                              Cancel
                            </ModalActionButton>
                          ) : null}
                          <ModalActionButton
                            action={editingQualificationId != null ? "update" : "add"}
                            type="button"
                            onClick={handleAddOrUpdateQualification}
                          >
                            {editingQualificationId != null ? "Update" : "Add Qualification"}
                          </ModalActionButton>
                        </div>
                      </div>

                      <div className="table-responsive patient-list-modal__table-wrap user-profile-page__qualification-table">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                          <thead>
                            <tr>
                              <th scope="col" className="text-center" style={{ width: "5%" }}>#</th>
                              <th scope="col">Degree</th>
                              <th scope="col">Specialization</th>
                              <th scope="col">Institution</th>
                              <th scope="col">Year</th>
                              <th scope="col">Document</th>
                              <th scope="col" className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualifications.map((item, index) => (
                              <tr key={item.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>{item.degree}</td>
                                <td>{item.specialization}</td>
                                <td>{item.institution}</td>
                                <td>{item.year}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-soft-info user-profile-page__qualification-view-btn"
                                    onClick={() => handleViewQualificationDocument(item)}
                                  >
                                    View
                                  </button>
                                </td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <button
                                      id={`qualification-edit-${item.id}`}
                                      type="button"
                                      className="btn btn-sm btn-soft-success edit-item-btn"
                                      onClick={() => handleEditQualification(item)}
                                    >
                                      <i className="ri-pencil-fill" />
                                    </button>
                                    <UncontrolledTooltip placement="top" target={`qualification-edit-${item.id}`}>
                                      Edit
                                    </UncontrolledTooltip>
                                    <button
                                      id={`qualification-del-${item.id}`}
                                      type="button"
                                      className="btn btn-sm btn-soft-danger remove-item-btn"
                                      onClick={() => handleDeleteQualification(item)}
                                    >
                                      <i className="ri-delete-bin-5-line" />
                                    </button>
                                    <UncontrolledTooltip placement="top" target={`qualification-del-${item.id}`}>
                                      Delete
                                    </UncontrolledTooltip>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {qualifications.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="text-center text-muted py-4">
                                  No qualifications added yet.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>
                  <TabPane tabId="hours">
                    <Form onSubmit={handleSaveHours}>
                      <div className="user-profile-page__hours-card">
                        <h5 className="user-profile-page__section-title">
                          <i className="ri-time-line" aria-hidden="true" />
                          Clinic Availability
                        </h5>

                        <div className="table-responsive user-profile-page__hours-table-wrap">
                          <table className="table align-middle mb-0 user-profile-page__hours-table">
                            <thead>
                              <tr>
                                <th>Day</th>
                                <th className="text-center">Available</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th className="text-center">Break</th>
                                <th>Break From</th>
                                <th>Break To</th>
                              </tr>
                            </thead>
                            <tbody>
                              {WEEK_DAYS.map((day) => {
                                const row = hoursSchedule[day.id] || createDefaultHoursDay({ available: false });
                                return (
                                  <tr key={day.id}>
                                    <td className="fw-semibold">{day.label}</td>
                                    <td className="text-center">
                                      <div className="form-check form-switch form-switch-success mb-0 d-inline-flex justify-content-center">
                                        <Input
                                          className="form-check-input"
                                          type="checkbox"
                                          role="switch"
                                          checked={Boolean(row.available)}
                                          onChange={(e) => updateHoursDay(day.id, "available", e.target.checked)}
                                          aria-label={`${day.label} available`}
                                        />
                                      </div>
                                    </td>
                                    <td>
                                      {renderHoursTimeSelect(day.id, "startTime", row.startTime, !row.available)}
                                    </td>
                                    <td>
                                      {renderHoursTimeSelect(day.id, "endTime", row.endTime, !row.available)}
                                    </td>
                                    <td className="text-center">
                                      <div className="form-check form-switch form-switch-success mb-0 d-inline-flex justify-content-center">
                                        <Input
                                          className="form-check-input"
                                          type="checkbox"
                                          role="switch"
                                          disabled={!row.available}
                                          checked={Boolean(row.breakEnabled)}
                                          onChange={(e) => updateHoursDay(day.id, "breakEnabled", e.target.checked)}
                                          aria-label={`${day.label} break`}
                                        />
                                      </div>
                                    </td>
                                    <td>
                                      {renderHoursTimeSelect(
                                        day.id,
                                        "breakFrom",
                                        row.breakFrom,
                                        !row.available || !row.breakEnabled
                                      )}
                                    </td>
                                    <td>
                                      {renderHoursTimeSelect(
                                        day.id,
                                        "breakTo",
                                        row.breakTo,
                                        !row.available || !row.breakEnabled
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="user-profile-page__hours-apply">
                          <span className="user-profile-page__hours-apply-label">Apply to All Days</span>
                          <div className="user-profile-page__hours-apply-days">
                            {WEEK_DAYS.map((day) => (
                              <Label
                                key={`apply-${day.id}`}
                                check
                                className="user-profile-page__hours-apply-day"
                              >
                                <Input
                                  type="checkbox"
                                  checked={Boolean(applyToDays[day.id])}
                                  onChange={() => toggleApplyDay(day.id)}
                                />
                                <span>{day.short}</span>
                              </Label>
                            ))}
                          </div>
                          <ModalActionButton
                            action="update"
                            type="button"
                            iconClassName="ri-check-line"
                            onClick={handleApplyHoursToSelectedDays}
                          >
                            Apply
                          </ModalActionButton>
                        </div>
                      </div>

                      <div className="user-profile-page__hours-card">
                        <h5 className="user-profile-page__section-title">
                          <i className="ri-stethoscope-line" aria-hidden="true" />
                          Consultation Mode
                        </h5>
                        <div className="user-profile-page__hours-mode">
                          <Label check className="user-profile-page__hours-mode-item">
                            <Input
                              type="checkbox"
                              checked={consultationMode.inClinic}
                              onChange={() => updateConsultationMode("inClinic")}
                            />
                            <span>In-Clinic</span>
                          </Label>
                          <Label check className="user-profile-page__hours-mode-item">
                            <Input
                              type="checkbox"
                              checked={consultationMode.teleconsultation}
                              onChange={() => updateConsultationMode("teleconsultation")}
                            />
                            <span>Teleconsultation</span>
                          </Label>
                          <Label check className="user-profile-page__hours-mode-item">
                            <Input
                              type="checkbox"
                              checked={consultationMode.both}
                              onChange={() => updateConsultationMode("both")}
                            />
                            <span>Both</span>
                          </Label>
                        </div>
                      </div>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>
                  <TabPane tabId="bank">
                    <Form onSubmit={handleSaveBank}>
                      <h5 className="user-profile-page__section-title">
                        <i className="ri-bank-line" aria-hidden="true" />
                        Bank Details
                      </h5>

                      <Row className="g-3 new-patient-modal__fields">
                        <Col lg={6} md={6} xs={12}>
                          <Label htmlFor="bankAccountHolderName" className="form-label new-patient-modal__label">
                            Account Holder Name
                            <RequiredMark />
                          </Label>
                          <Input
                            id="bankAccountHolderName"
                            type="text"
                            value={bankForm.accountHolderName}
                            onChange={(e) => updateBankField("accountHolderName", e.target.value)}
                          />
                        </Col>
                        <Col lg={6} md={6} xs={12}>
                          <Label htmlFor="bankName" className="form-label new-patient-modal__label">
                            Bank Name
                            <RequiredMark />
                          </Label>
                          <Input
                            id="bankName"
                            type="select"
                            value={bankForm.bankName}
                            onChange={(e) => updateBankField("bankName", e.target.value)}
                          >
                            <option value="">Select bank</option>
                            {BANK_NAME_OPTIONS.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </Input>
                        </Col>
                        <Col lg={6} md={6} xs={12}>
                          <Label htmlFor="bankAccountNumber" className="form-label new-patient-modal__label">
                            Account Number
                            <RequiredMark />
                          </Label>
                          <Input
                            id="bankAccountNumber"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={bankForm.accountNumber}
                            onChange={(e) => updateBankField("accountNumber", e.target.value)}
                          />
                        </Col>
                        <Col lg={6} md={6} xs={12}>
                          <Label htmlFor="bankConfirmAccountNumber" className="form-label new-patient-modal__label">
                            Confirm Account Number
                            <RequiredMark />
                          </Label>
                          <Input
                            id="bankConfirmAccountNumber"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={bankForm.confirmAccountNumber}
                            onChange={(e) => updateBankField("confirmAccountNumber", e.target.value)}
                          />
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="bankIfscCode" className="form-label new-patient-modal__label">
                            IFSC Code
                            <RequiredMark />
                          </Label>
                          <Input
                            id="bankIfscCode"
                            type="text"
                            value={bankForm.ifscCode}
                            onChange={(e) => updateBankField("ifscCode", e.target.value.toUpperCase())}
                          />
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="bankBranchName" className="form-label new-patient-modal__label">
                            Branch Name
                          </Label>
                          <Input
                            id="bankBranchName"
                            type="text"
                            value={bankForm.branchName}
                            onChange={(e) => updateBankField("branchName", e.target.value)}
                          />
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="bankAccountType" className="form-label new-patient-modal__label">
                            Account Type
                            <RequiredMark />
                          </Label>
                          <Input
                            id="bankAccountType"
                            type="select"
                            value={bankForm.accountType}
                            onChange={(e) => updateBankField("accountType", e.target.value)}
                          >
                            <option value="">Select account type</option>
                            {ACCOUNT_TYPE_OPTIONS.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </Input>
                        </Col>
                      </Row>

                      <div className="user-profile-page__bank-secure-note" role="note">
                        <i className="ri-lock-2-line" aria-hidden="true" />
                        <span>Your bank details are securely stored and used for payout purposes only.</span>
                      </div>

                      <div className="user-profile-page__form-footer">
                        <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                          Cancel
                        </ModalActionButton>
                        <ModalActionButton action="update" type="submit">
                          Update
                        </ModalActionButton>
                      </div>
                    </Form>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserProfile;
