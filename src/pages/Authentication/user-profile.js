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
  Label,
  Input,
  Form,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  UncontrolledTooltip,
} from "reactstrap";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import Swal from "sweetalert2";

import ModalActionButton from "../../Components/Common/ModalActionButton";
import { resetProfileFlag } from "../../slices/thunks";
import { navigateToRoleDashboard } from "../../helpers/navigateToRoleDashboard";
import { resolveUserRole, UserRole } from "../../Components/constants/roles";
import ReceptionProfileFields from "../Reception/ReceptionProfileFields";
import PatientProfileFields from "./PatientProfileFields";
import DoctorReviewsPanel from "./DoctorReviewsPanel";
import { rankingExplain, saveFee } from "../../helpers/s4Week4Api";
import { getAuthDoctorId } from "../../helpers/appointmentSlotHelper";
import defaultAvatar from "../../assets/images/users/user-dummy-img.jpg";
import { notifyProfilePhotoChanged } from "../../helpers/profilePhotoEvents";
import { dispatchDoctorScheduleChanged } from "../../helpers/dashboard_helper";
import {
  getDoctorProfileMe,
  updateDoctorProfileMe,
  uploadDoctorProfilePhoto,
  getDoctorCredentialsMe,
  uploadDoctorCredentialDocument,
  updateDoctorCredentialDocument,
  deleteDoctorCredentialDocument,
  downloadDoctorCredentialDocument,
  removeDoctorProfilePhoto,
  getDoctorPhotoBlob,
  getAvailabilityMe,
  updateAvailabilityMe,
  confirmMobileAgainstProfile,
  getRegistrationCountries,
  getRegistrationStates,
  getRegistrationDistricts,
  getRegistrationCities,
  getRegistrationPinCodes,
  getUserById,
  updateUser,
} from "../../helpers/realbackend_helper";
import { clinicMessage, deleteDoctorTimeOff, listDoctorTimeOff, saveDoctorTimeOff, unwrapClinic } from "../../helpers/doctorClinicApi";

const PROFILE_TABS = [
  { id: "profile", label: "Profile" },
  { id: "clinic", label: "Clinic" },
  { id: "fees", label: "Fees", doctorOnly: true },
  { id: "photo", label: "Photo" },
  { id: "qualifications", label: "Qualifications", doctorOnly: true },
  { id: "credentials", label: "Credentials/Documents", doctorOnly: true },
  { id: "hours", label: "Hours" },
  { id: "bank", label: "Bank" },
  { id: "reviews", label: "My Reviews", doctorOnly: true },
];

const getProfileTabsForRole = (role) => {
  if (role && role !== UserRole.DOCTOR) {
    return PROFILE_TABS.filter((tab) => tab.id === "profile");
  }
  return PROFILE_TABS;
};

const getRoleDisplayLabel = (role) => {
  if (role === UserRole.RECEPTION) return "Receptionist";
  return role || "N/A";
};

const CREDENTIAL_DOCUMENTS = [
  { type: "Qualification", label: "BHMS Certificate" },
  { type: "Registration", label: "Registration" },
  { type: "Experience", label: "Experience" },
  { type: "Other", label: "Other Document" },
];

const getCredentialDocId = (doc) => doc.doctorCredentialDocumentId || doc.DoctorCredentialDocumentId;
const getCredentialDocType = (doc) => doc.documentType || doc.DocumentType || "Other";
const getCredentialDocStatus = (doc) =>
  doc.status || doc.Status || doc.verificationStatus || doc.VerificationStatus || "";

const openCredentialDocument = async (id) => {
  try {
    const response = await downloadDoctorCredentialDocument(id);
    const blob = response?.data instanceof Blob ? response.data : response;
    if (!(blob instanceof Blob)) throw new Error("Could not open the document.");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    Swal.fire({ title: "Could not open file", text: err?.message || String(err), icon: "error" });
  }
};

const DoctorCredentialsPanel = () => {
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState([]);
  const [busyType, setBusyType] = useState("");
  const fileRef = useRef(null);
  const pendingTypeRef = useRef("");

  const reload = () => {
    getDoctorCredentialsMe()
      .then((payload) => {
        const me = payload?.data ?? payload?.Data ?? payload;
        setStatus(me?.status || me?.Status || "");
        const list = me?.documents ?? me?.Documents ?? [];
        setDocs(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setDocs([]);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const pickFile = (type) => {
    pendingTypeRef.current = type;
    fileRef.current?.click();
  };

  const handleFileChosen = async (event) => {
    const file = event.target.files?.[0];
    const type = pendingTypeRef.current;
    event.target.value = "";
    if (!file || !type) return;
    setBusyType(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", type);
      await uploadDoctorCredentialDocument(formData);
      reload();
      Swal.fire({ title: "Uploaded", text: "Status is Pending until Admin reviews Trust queue.", icon: "success", timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Upload failed", text: err?.message || String(err), icon: "error" });
    } finally {
      setBusyType("");
    }
  };

  const latestDocByType = docs.reduce((acc, doc) => {
    acc[getCredentialDocType(doc)] = doc;
    return acc;
  }, {});

  const rows = CREDENTIAL_DOCUMENTS.map((item) => ({ ...item, doc: latestDocByType[item.type] }));

  return (
    <div>
      <h5 className="user-profile-page__section-title">
        <i className="ri-shield-check-line" aria-hidden="true" />
        Credentials/Documents
      </h5>
      <p className="text-muted">Verification status: <strong>{status || "Pending"}</strong></p>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="d-none"
        onChange={handleFileChosen}
      />

      <div className="user-profile-page__cred-wrap">
        <table className="table align-middle mb-0 user-profile-page__cred-table">
          <thead>
            <tr>
              <th scope="col">Document</th>
              <th scope="col">Upload</th>
              <th scope="col" className="text-center">Approval</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ type, label, doc }) => {
              const docStatus = doc ? getCredentialDocStatus(doc) || status || "Pending" : "Not uploaded";
              const approved = Boolean(doc) && /^approved$/i.test(docStatus);
              const busy = busyType === type;
              return (
                <tr key={type}>
                  <td>
                    <span className="user-profile-page__cred-name">
                      <span className="user-profile-page__cred-icon" aria-hidden="true">
                        <i className="ri-file-text-line" />
                      </span>
                      <span>
                        {label}
                        {doc ? (
                          <span className="user-profile-page__cred-file">{doc.fileName || doc.FileName || "document"}</span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td>
                    {doc ? (
                      <span className="d-inline-flex align-items-center gap-2 flex-wrap">
                        <span className="user-profile-page__cred-badge user-profile-page__cred-badge--uploaded">
                          Uploaded
                        </span>
                        <button
                          type="button"
                          className="user-profile-page__cred-view"
                          onClick={() => openCredentialDocument(getCredentialDocId(doc))}
                          title="View document"
                        >
                          <i className="ri-eye-line" aria-hidden="true" />
                          View
                        </button>
                        <button
                          type="button"
                          className="user-profile-page__cred-link"
                          onClick={() => pickFile(type)}
                          disabled={busy}
                        >
                          {busy ? "Uploading…" : "Replace"}
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="user-profile-page__cred-badge user-profile-page__cred-badge--upload"
                        onClick={() => pickFile(type)}
                        disabled={busy}
                      >
                        <i className="ri-upload-cloud-2-line" aria-hidden="true" />
                        {busy ? "Uploading…" : "Upload"}
                      </button>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="user-profile-page__cred-approval-cell">
                      <span
                        className={`user-profile-page__cred-approval ${
                          approved ? "user-profile-page__cred-approval--yes" : "user-profile-page__cred-approval--no"
                        }`}
                        title={approved ? "Approved" : docStatus}
                      >
                        <i className={approved ? "ri-check-line" : "ri-close-line"} aria-hidden="true" />
                      </span>
                      <span className="user-profile-page__cred-approval-text">{approved ? "Approved" : docStatus}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-muted small mt-2 mb-0">Accepted formats: PDF, JPG, PNG.</p>
    </div>
  );
};

const INDIA_COUNTRY_ID = 78;

const DEFAULT_CLINIC_FORM = {
  clinicName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  countryId: "",
  stateId: "",
  districtId: "",
  cityId: "",
  pinCodeId: "",
  contactNumber: "",
  email: "",
  googleMapsLink: "",
};

const masterOptions = (rows, idKeys, nameKeys) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: Number(idKeys.map((key) => row?.[key]).find((value) => value != null && value !== "")),
      name: String(nameKeys.map((key) => row?.[key]).find(Boolean) || "").trim(),
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.name);

const pinOptions = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: Number(row.pinCodeId ?? row.PinCodeId ?? 0),
      name: String(row.pinCode ?? row.PinCode ?? "").trim(),
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.name);

const DEFAULT_FEES_FORM = {
  inClinic: {
    consultationFee: "",
    followUpFee: "",
    currency: "INR",
    freeFollowUpDays: "",
  },
  tele: {
    enabled: false,
    consultationFee: "",
    followUpFee: "",
    currency: "INR",
    freeFollowUpDays: "",
  },
};

const toFieldText = (value) => (value === null || value === undefined ? "" : String(value));
const toOptionalNumber = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
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
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  branchName: "",
  accountType: "",
  pan: "",
};

const DEGREE_OPTIONS = ["BHMS", "MD", "BAMS", "DHMS", "MBBS", "PhD", "Other"];

const EMPTY_QUALIFICATION_FORM = {
  degree: "",
  specialization: "",
  institution: "",
  year: "",
  documentName: "",
  documentFile: null,
};

const mapQualificationDoc = (doc) => ({
  id: doc.doctorCredentialDocumentId ?? doc.DoctorCredentialDocumentId,
  degree: doc.degree || doc.Degree || "",
  specialization: doc.specialization || doc.Specialization || "",
  institution: doc.institution || doc.Institution || "",
  year: toFieldText(doc.passingYear ?? doc.PassingYear),
  documentName: doc.fileName || doc.FileName || "",
  hasFile: Boolean(doc.filePath || doc.FilePath),
});

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

/** Full day in 30-minute steps (12:00 AM → 11:30 PM) for Hours start/end/break selects. */
const HOUR_TIME_OPTIONS = (() => {
  const opts = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    opts.push(
      `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`
    );
  }
  return opts;
})();

const createDefaultHoursDay = (overrides = {}) => ({
  available: true,
  startTime: "09:00 AM",
  endTime: "01:00 PM",
  breakEnabled: false,
  breakFrom: "01:00 PM",
  breakTo: "02:00 PM",
  ...overrides,
});

const UNAVAILABLE_DAY = {
  available: false,
  startTime: "",
  endTime: "",
  breakEnabled: false,
  breakFrom: "",
  breakTo: "",
};

const INITIAL_HOURS_SCHEDULE = WEEK_DAYS.reduce(
  (acc, day) => ({ ...acc, [day.id]: { ...UNAVAILABLE_DAY } }),
  {}
);

const INITIAL_CONSULTATION_MODE = {
  inClinic: true,
  teleconsultation: false,
  both: false,
};

const amPmToHms = (value) => {
  const raw = String(value || "").trim();
  const hhmm = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmm) {
    return `${String(Number(hhmm[1])).padStart(2, "0")}:${hhmm[2]}:${hhmm[3] || "00"}`;
  }
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!ampm) return "10:00:00";
  let hour = Number(ampm[1]);
  const minute = ampm[2];
  const period = ampm[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}:00`;
};

const hmsToAmPm = (value) => {
  const m = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  let hour = Number(m[1]);
  const minute = m[2];
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
};

const nextDateForWeekday = (dayId) => {
  const map = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const target = map[dayId];
  const now = new Date();
  const diff = (target - now.getDay() + 7) % 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const weekdayIdFromDate = (value) => {
  // Date-only strings must be local calendar days (UTC parse shifts the weekday).
  const raw = String(value || "").trim();
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = ymd
    ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    : new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][d.getDay()];
};

const showSaveResult = (ok, text) => {
  Swal.fire({
    title: ok ? "Saved!" : "Not saved",
    text,
    icon: ok ? "success" : "error",
    timer: ok ? 1500 : 2500,
    showConfirmButton: !ok,
  });
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
  const [email, setemail] = useState("");
  const [idx, setidx] = useState("");
  const [userName, setUserName] = useState("");
  const [doctorMobile, setDoctorMobile] = useState("");
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    mobileNo: "",
    registrationNo: "",
    casePaperValidity: "",
    practiceActivated: false,
  });
  const [ranking, setRanking] = useState(null);
  const [bookingRules, setBookingRules] = useState({ gapMinutes: "", horizonDays: "" });
  const [personalSaving, setPersonalSaving] = useState(false);
  const [editingStaffProfile, setEditingStaffProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("clinic");
  const isReceptionProfile = String(resolveUserRole(userData) || "").toLowerCase() === UserRole.RECEPTION.toLowerCase();
  const isPatientProfile = String(resolveUserRole(userData) || "").toLowerCase() === UserRole.PATIENT.toLowerCase();
  const [clinicForm, setClinicForm] = useState(DEFAULT_CLINIC_FORM);
  const [countries, setCountries] = useState([]);
  const [locationStates, setLocationStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [pinCodes, setPinCodes] = useState([]);
  const [timeOffRows, setTimeOffRows] = useState([]);
  const [timeOffForm, setTimeOffForm] = useState({ start: "", end: "", reason: "" });
  const [timeOffBusy, setTimeOffBusy] = useState(false);
  const [feesForm, setFeesForm] = useState(DEFAULT_FEES_FORM);
  const [profilePhoto, setProfilePhoto] = useState(defaultAvatar);
  const [photoFileInputKey, setPhotoFileInputKey] = useState(0);
  const [photoFile, setPhotoFile] = useState(null);
  const photoInputRef = useRef(null);
  const [qualifications, setQualifications] = useState([]);
  const [qualificationBusy, setQualificationBusy] = useState(false);
  const [qualificationForm, setQualificationForm] = useState(EMPTY_QUALIFICATION_FORM);
  const [editingQualificationId, setEditingQualificationId] = useState(null);
  const [qualificationFileKey, setQualificationFileKey] = useState(0);
  const qualificationFileRef = useRef(null);
  const [hoursSchedule, setHoursSchedule] = useState(INITIAL_HOURS_SCHEDULE);
  const [consultationMode, setConsultationMode] = useState(INITIAL_CONSULTATION_MODE);
  const [bankForm, setBankForm] = useState(DEFAULT_BANK_FORM);

  const selectLayoutState = (state) => state.Profile;
  const userprofileData = createSelector(selectLayoutState, (state) => ({
    user: state.user,
  }));

  const { user } = useSelector(userprofileData);

  const isReceptionUser = userData?.role === UserRole.RECEPTION;
  const roleLabel = getRoleDisplayLabel(userData?.role);
  const doctorDisplayName = String(userName || "").replace(/^dr\.?\s*/i, "").trim();
  const profileSubjectName =
    userData?.role === UserRole.DOCTOR
      ? doctorDisplayName
        ? `Dr. ${doctorDisplayName}`
        : "Doctor"
      : userData?.displayName || userName || "";

  useEffect(() => {
    const authUserStr = sessionStorage.getItem("authUser");
    if (authUserStr) {
      try {
        const obj = JSON.parse(authUserStr);
        const userInfo = obj.data || obj;

        if (userInfo) {
          setUserData(userInfo);
          setUserName(userInfo.displayName || [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ") || userInfo.userName || "");
          setemail(userInfo.email || userInfo.emailId || userInfo.EmailId || "");
          setDoctorMobile(userInfo.mobileNo || userInfo.MobileNo || "");
          setidx(userInfo.userId || userInfo._id || "");
          setPersonalForm((prev) => ({
            ...prev,
            firstName: userInfo.firstName || "",
            middleName: userInfo.middleName || "",
            lastName: userInfo.lastName || "",
            email: userInfo.email || userInfo.emailId || userInfo.EmailId || "",
            mobileNo: userInfo.mobileNo || userInfo.MobileNo || "",
          }));

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

  useEffect(() => {
    const tabs = getProfileTabsForRole(userData?.role);
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id || "profile");
    }
  }, [userData?.role, activeTab]);

  const loadQualifications = (isCancelled = () => false) =>
    getDoctorCredentialsMe()
      .then((payload) => {
        if (isCancelled()) return;
        const me = payload?.data ?? payload?.Data ?? payload;
        const docs = me?.documents ?? me?.Documents ?? [];
        const rows = (Array.isArray(docs) ? docs : [])
          .filter((doc) => /^qualification$/i.test(doc.documentType || doc.DocumentType || ""))
          .map(mapQualificationDoc);
        setQualifications(rows);
      })
      .catch(() => {});

  const loadClinicMasters = ({ countryId, stateId, districtId, cityId }) => {
    getRegistrationCountries()
      .then((rows) => setCountries(masterOptions(rows, ["countryId", "CountryId"], ["countryName", "CountryName"])))
      .catch(() => setCountries([]));
    if (countryId) {
      getRegistrationStates(countryId)
        .then((rows) => setLocationStates(masterOptions(rows, ["stateId", "StateId"], ["stateName", "StateName"])))
        .catch(() => setLocationStates([]));
    }
    if (stateId) {
      getRegistrationDistricts(stateId)
        .then((rows) => setDistricts(masterOptions(rows, ["districtId", "DistrictId"], ["districtName", "DistrictName"])))
        .catch(() => setDistricts([]));
    }
    if (districtId) {
      getRegistrationCities(districtId)
        .then((rows) => setCities(masterOptions(rows, ["cityId", "CityId"], ["cityName", "CityName"])))
        .catch(() => setCities([]));
    }
    if (cityId) {
      getRegistrationPinCodes(cityId)
        .then((rows) => setPinCodes(pinOptions(rows)))
        .catch(() => setPinCodes([]));
    }
  };

  useEffect(() => {
    let cancelled = false;
    let role = "";
    try {
      const stored = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const info = stored.data || stored;
      role = info.role || info.Role || "";
    } catch {
      role = "";
    }
    if (role && role !== UserRole.DOCTOR) return undefined;
    getDoctorProfileMe()
      .then((payload) => {
        if (cancelled) return;
        const me = payload?.data ?? payload?.Data ?? payload;
        if (!me) return;
        const fullName = [me.firstName, me.middleName, me.lastName].filter(Boolean).join(" ").trim();
        if (fullName) setUserName(fullName);
        setemail(me.emailId || "");
        setDoctorMobile(me.mobileNo || "");
        setPersonalForm({
          firstName: me.firstName || "",
          middleName: me.middleName || "",
          lastName: me.lastName || "",
          email: me.emailId || "",
          mobileNo: me.mobileNo || "",
          registrationNo: me.registrationNo || me.passingCertNo || "",
          casePaperValidity: me.casePaperValidity != null ? String(me.casePaperValidity) : "",
          practiceActivated: Boolean(me.practiceActivated),
        });
        const countryId = me.countryId || INDIA_COUNTRY_ID;
        setClinicForm({
          clinicName: me.clinicName || "",
          addressLine1: me.addressLine1 || "",
          addressLine2: me.addressLine2 || "",
          city: me.cityName || me.city || "",
          state: me.state || "",
          pincode: me.pincode || "",
          countryId: String(countryId),
          stateId: me.stateId ? String(me.stateId) : "",
          districtId: me.districtId ? String(me.districtId) : "",
          cityId: me.cityId ? String(me.cityId) : "",
          pinCodeId: me.pinCodeId ? String(me.pinCodeId) : "",
          contactNumber: me.mobileNo || "",
          email: me.emailId || "",
          googleMapsLink: me.googleMapsLink || "",
        });
        loadClinicMasters({
          countryId,
          stateId: me.stateId,
          districtId: me.districtId,
          cityId: me.cityId,
        });
        setUserData((prev) => ({
          ...prev,
          firstName: me.firstName || "",
          middleName: me.middleName || "",
          lastName: me.lastName || "",
          email: me.emailId || "",
          mobileNo: me.mobileNo || "",
          loginId: me.loginId || prev?.loginId || "",
          role: me.roleName || prev?.role,
          doctorId: me.doctorId,
          verificationStatus: me.verificationStatus || "",
          packageName: me.packageName || "",
          registrationNo: me.registrationNo || me.passingCertNo || "",
          practiceActivated: Boolean(me.practiceActivated),
        }));
        const currency = me.feeCurrency || "";
        const teleOn = me.consultFeeTele != null;
        setFeesForm({
          inClinic: {
            consultationFee: toFieldText(me.consultFeeInClinic),
            followUpFee: toFieldText(me.followUpFeeInClinic),
            currency,
            freeFollowUpDays: toFieldText(me.freeFollowUpDaysInClinic),
          },
          tele: {
            enabled: teleOn,
            consultationFee: toFieldText(me.consultFeeTele),
            followUpFee: toFieldText(me.followUpFeeTele),
            currency,
            freeFollowUpDays: toFieldText(me.freeFollowUpDaysTele),
          },
        });
        setConsultationMode({
          inClinic: true,
          teleconsultation: teleOn || Boolean(me.isOnline),
          both: teleOn || Boolean(me.isOnline),
        });
        const kyc = me.kyc || {};
        setBankForm({
          accountHolderName: kyc.accountHolder || "",
          bankName: kyc.bankName || "",
          accountNumber: kyc.accountNumber || "",
          confirmAccountNumber: kyc.accountNumber || "",
          ifscCode: kyc.ifsc || "",
          branchName: kyc.branchName || "",
          accountType: kyc.accountType || "",
          pan: kyc.pan || "",
        });
        if (me.photoPath && me.doctorId) {
          getDoctorPhotoBlob(me.doctorId)
            .then((response) => {
              const blob = response?.data instanceof Blob ? response.data : response;
              if (cancelled || !(blob instanceof Blob) || blob.size === 0) return;
              setProfilePhoto(URL.createObjectURL(blob));
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    loadQualifications(() => cancelled);
    getAvailabilityMe()
      .then((payload) => {
        if (cancelled) return;
        const me = payload?.data ?? payload;
        setBookingRules({
          gapMinutes: me?.gapMinutes ?? me?.GapMinutes ?? "",
          horizonDays: me?.bookingHorizonDays ?? me?.BookingHorizonDays ?? "",
        });
        const rows = me?.weekSchedules ?? me?.WeekSchedules ?? [];
        if (!Array.isArray(rows) || rows.length === 0) return;
        setHoursSchedule((prev) => {
          const next = { ...prev };
          WEEK_DAYS.forEach((day) => {
            next[day.id] = { ...UNAVAILABLE_DAY };
          });
          rows.forEach((row) => {
            const id = weekdayIdFromDate(row.scheduleDate || row.ScheduleDate);
            if (!id) return;
            const start = hmsToAmPm(row.workStartTime || row.WorkStartTime);
            const end = hmsToAmPm(row.workEndTime || row.WorkEndTime);
            const breakFrom = hmsToAmPm(row.breakStartTime || row.BreakStartTime);
            const breakTo = hmsToAmPm(row.breakEndTime || row.BreakEndTime);
            next[id] = {
              ...createDefaultHoursDay(),
              available: true,
              startTime: start,
              endTime: end,
              breakEnabled: Boolean(breakFrom && breakTo),
              breakFrom,
              breakTo,
            };
          });
          return next;
        });
      })
      .catch(() => {});
    listDoctorTimeOff()
      .then((payload) => {
        if (cancelled) return;
        const rows = unwrapClinic(payload);
        setTimeOffRows(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = Number(userData?.doctorId);
    if (!id || userData?.role !== UserRole.DOCTOR) return undefined;
    let cancelled = false;
    rankingExplain(id)
      .then((payload) => {
        if (cancelled) return;
        const body = payload?.data ?? payload;
        const inner = body?.score != null || body?.Score != null ? body : (body?.data ?? body);
        setRanking(inner && typeof inner === "object" ? {
          score: inner.score ?? inner.Score,
          parts: inner.parts || inner.Parts || null,
        } : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userData?.doctorId, userData?.role]);

  const applyPersonalToSession = (fullName, emailValue, mobileValue, extra = {}) => {
    setUserName(fullName);
    setemail(emailValue);
    setDoctorMobile(mobileValue);
    setUserData((prev) => ({
      ...prev,
      ...extra,
      firstName: extra.firstName ?? prev?.firstName,
      middleName: extra.middleName ?? prev?.middleName,
      lastName: extra.lastName ?? prev?.lastName,
      email: emailValue,
      emailId: emailValue,
      mobileNo: mobileValue,
      displayName: fullName,
    }));
    try {
      const stored = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const target = stored.data || stored;
      target.email = emailValue;
      target.emailId = emailValue;
      target.displayName = fullName;
      target.firstName = extra.firstName ?? target.firstName;
      target.middleName = extra.middleName ?? target.middleName;
      target.lastName = extra.lastName ?? target.lastName;
      target.mobileNo = mobileValue;
      sessionStorage.setItem("authUser", JSON.stringify(stored));
    } catch (_) {
      /* session copy is display-only */
    }
  };

  const handleSaveStaffProfile = async (event) => {
    event?.preventDefault?.();
    const firstName = personalForm.firstName.trim();
    const middleName = personalForm.middleName.trim();
    const lastName = personalForm.lastName.trim();
    const emailValue = personalForm.email.trim();
    const mobileValue = personalForm.mobileNo.trim();
    if (!firstName || !lastName) {
      showSaveResult(false, "First name and last name are required.");
      return;
    }
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      showSaveResult(false, "Enter a valid email address.");
      return;
    }
    if (mobileValue && mobileValue.replace(/\D/g, "").length < 10) {
      showSaveResult(false, "Enter a valid mobile number (at least 10 digits).");
      return;
    }
    const userId = Number(userData?.userId || userData?.UserId || idx || 0);
    if (!userId) {
      showSaveResult(false, "Your user account could not be loaded for save.");
      return;
    }
    setPersonalSaving(true);
    try {
      const existingRaw = await getUserById(userId);
      const existing =
        existingRaw?.resultObject ??
        existingRaw?.ResultObject ??
        existingRaw?.data ??
        existingRaw?.Data ??
        existingRaw ??
        {};
      await updateUser({
        ...existing,
        userId,
        firstName,
        lastName,
        middleName: middleName || existing.middleName || existing.MiddleName || "",
        emailId: emailValue,
        mobileNo: mobileValue,
        userName: existing.userName || existing.UserName || userData?.loginId || userData?.userName,
        roleId: existing.roleId ?? existing.RoleId ?? userData?.roleId,
        userStatus: existing.userStatus ?? existing.UserStatus ?? true,
        deleteStatus: false,
        enteredBy: existing.enteredBy || existing.EnteredBy || userData?.loginId || "self",
      });
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
      applyPersonalToSession(fullName, emailValue, mobileValue, { firstName, middleName, lastName });
      setEditingStaffProfile(false);
      showSaveResult(true, "Profile details have been updated.");
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Save failed.");
    } finally {
      setPersonalSaving(false);
    }
  };

  const handleSavePersonal = async (event) => {
    event.preventDefault();
    const firstName = personalForm.firstName.trim();
    const middleName = personalForm.middleName.trim();
    const lastName = personalForm.lastName.trim();
    const emailValue = personalForm.email.trim();
    const mobileValue = personalForm.mobileNo.trim();
    const registrationNo = personalForm.registrationNo.trim();
    const validityRaw = String(personalForm.casePaperValidity || "").trim();
    const casePaperValidity = validityRaw === "" ? null : Number(validityRaw);
    if (!firstName || !lastName) {
      showSaveResult(false, "First name and last name are required.");
      return;
    }
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      showSaveResult(false, "Enter a valid email address.");
      return;
    }
    if (mobileValue && mobileValue.replace(/\D/g, "").length < 10) {
      showSaveResult(false, "Enter a valid mobile number (at least 10 digits).");
      return;
    }
    if (validityRaw !== "" && (!Number.isInteger(casePaperValidity) || casePaperValidity < 1)) {
      showSaveResult(false, "Case paper validity must be a whole number of days.");
      return;
    }
    setPersonalSaving(true);
    try {
      await updateDoctorProfileMe({
        firstName,
        middleName,
        lastName,
        emailId: emailValue,
        mobileNo: mobileValue,
        passingCertNo: registrationNo,
        casePaperValidity: validityRaw === "" ? 0 : casePaperValidity,
        practiceActivated: Boolean(personalForm.practiceActivated),
      });
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
      applyPersonalToSession(fullName, emailValue, mobileValue, {
        firstName,
        middleName,
        lastName,
        registrationNo,
        practiceActivated: Boolean(personalForm.practiceActivated),
      });
      setClinicForm((prev) => ({ ...prev, email: emailValue, contactNumber: mobileValue }));
      showSaveResult(true, "Personal details have been updated.");
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Save failed.");
    } finally {
      setPersonalSaving(false);
    }
  };

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

  const chooseCountry = async (countryId) => {
    setClinicForm((prev) => ({
      ...prev,
      countryId,
      stateId: "",
      state: "",
      districtId: "",
      cityId: "",
      city: "",
      pinCodeId: "",
      pincode: "",
    }));
    setDistricts([]);
    setCities([]);
    setPinCodes([]);
    if (!countryId) {
      setLocationStates([]);
      return;
    }
    const rows = await getRegistrationStates(countryId).catch(() => []);
    setLocationStates(masterOptions(rows, ["stateId", "StateId"], ["stateName", "StateName"]));
  };

  const chooseState = async (stateId) => {
    const state = locationStates.find((row) => String(row.id) === String(stateId));
    setClinicForm((prev) => ({
      ...prev,
      stateId,
      state: state?.name || "",
      districtId: "",
      cityId: "",
      city: "",
      pinCodeId: "",
      pincode: "",
    }));
    setCities([]);
    setPinCodes([]);
    if (!stateId) {
      setDistricts([]);
      return;
    }
    const rows = await getRegistrationDistricts(stateId).catch(() => []);
    setDistricts(masterOptions(rows, ["districtId", "DistrictId"], ["districtName", "DistrictName"]));
  };

  const chooseDistrict = async (districtId) => {
    setClinicForm((prev) => ({
      ...prev,
      districtId,
      cityId: "",
      city: "",
      pinCodeId: "",
      pincode: "",
    }));
    setPinCodes([]);
    if (!districtId) {
      setCities([]);
      return;
    }
    const rows = await getRegistrationCities(districtId).catch(() => []);
    setCities(masterOptions(rows, ["cityId", "CityId"], ["cityName", "CityName"]));
  };

  const chooseCity = async (cityId) => {
    const city = cities.find((row) => String(row.id) === String(cityId));
    setClinicForm((prev) => ({
      ...prev,
      cityId,
      city: city?.name || "",
      pinCodeId: "",
      pincode: "",
    }));
    if (!cityId) {
      setPinCodes([]);
      return;
    }
    const rows = await getRegistrationPinCodes(cityId).catch(() => []);
    setPinCodes(pinOptions(rows));
  };

  const choosePin = (pinCodeId) => {
    const pin = pinCodes.find((row) => String(row.id) === String(pinCodeId));
    setClinicForm((prev) => ({ ...prev, pinCodeId, pincode: pin?.name || "" }));
  };

  const refreshTimeOff = async () => {
    const rows = unwrapClinic(await listDoctorTimeOff());
    setTimeOffRows(Array.isArray(rows) ? rows : []);
  };

  const handleAddTimeOff = async (event) => {
    event.preventDefault();
    if (!timeOffForm.start || !timeOffForm.end) {
      showSaveResult(false, "Choose the leave start and end dates.");
      return;
    }
    setTimeOffBusy(true);
    try {
      const rows = unwrapClinic(await saveDoctorTimeOff({
        startsAt: `${timeOffForm.start}T00:00:00`,
        endsAt: `${timeOffForm.end}T23:59:00`,
        reason: timeOffForm.reason.trim() || null,
      }));
      setTimeOffRows(Array.isArray(rows) ? rows : []);
      setTimeOffForm({ start: "", end: "", reason: "" });
      showSaveResult(true, "Leave dates have been saved.");
    } catch (err) {
      showSaveResult(false, clinicMessage(err));
    } finally {
      setTimeOffBusy(false);
    }
  };

  const handleDeleteTimeOff = async (id) => {
    setTimeOffBusy(true);
    try {
      await deleteDoctorTimeOff(id);
      await refreshTimeOff();
    } catch (err) {
      showSaveResult(false, clinicMessage(err));
    } finally {
      setTimeOffBusy(false);
    }
  };

  const updateFeesSection = (section, field, value) => {
    if (field === "currency") {
      setFeesForm((prev) => ({
        ...prev,
        inClinic: { ...prev.inClinic, currency: value },
        tele: { ...prev.tele, currency: value },
      }));
      return;
    }
    setFeesForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveClinic = async (event) => {
    event.preventDefault();
    if (
      !clinicForm.clinicName.trim() ||
      !clinicForm.addressLine1.trim() ||
      !clinicForm.stateId ||
      !clinicForm.districtId ||
      !clinicForm.cityId ||
      !clinicForm.pinCodeId
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

    try {
      await updateDoctorProfileMe({
        firstName: userData.firstName || undefined,
        lastName: userData.lastName || undefined,
        clinicName: clinicForm.clinicName.trim(),
        city: clinicForm.city.trim(),
        addressLine1: clinicForm.addressLine1.trim(),
        addressLine2: clinicForm.addressLine2.trim(),
        state: clinicForm.state.trim(),
        pincode: clinicForm.pincode.trim(),
        countryId: Number(clinicForm.countryId) || INDIA_COUNTRY_ID,
        stateId: Number(clinicForm.stateId),
        districtId: Number(clinicForm.districtId),
        cityId: Number(clinicForm.cityId),
        pinCodeId: Number(clinicForm.pinCodeId),
        emailId: clinicForm.email.trim(),
        mobileNo: clinicForm.contactNumber.trim(),
        googleMapsLink: (clinicForm.googleMapsLink || "").trim(),
      });
      setemail(clinicForm.email.trim());
      setDoctorMobile(clinicForm.contactNumber.trim());
      setPersonalForm((prev) => ({ ...prev, email: clinicForm.email.trim(), mobileNo: clinicForm.contactNumber.trim() }));
      if (clinicForm.contactNumber.trim()) {
        try {
          const check = await confirmMobileAgainstProfile({ mobileNo: clinicForm.contactNumber.trim() });
          const matched = check?.data?.matched ?? check?.data?.Matched;
          if (matched === false) {
            showSaveResult(true, "Clinic saved. Mobile was stored; confirm-number now uses this number.");
            return;
          }
        } catch (_) {
          /* confirm is extra proof, clinic save already succeeded */
        }
      }
      showSaveResult(true, "Clinic information has been updated.");
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Clinic save failed.");
    }
  };

  const handleSaveFees = async (event) => {
    event.preventDefault();
    if (!String(feesForm.inClinic.consultationFee || "").trim()) {
      Swal.fire({
        title: "Missing details",
        text: "Please enter the Present fee.",
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

    try {
      const teleOn = Boolean(feesForm.tele.enabled);
      const presentFee = Number(feesForm.inClinic.consultationFee);
      const teleFee = teleOn ? Number(feesForm.tele.consultationFee) : presentFee;
      const currency = feesForm.inClinic.currency || "INR";
      await updateDoctorProfileMe({
        consultFeeInClinic: presentFee,
        consultFeeTele: teleOn ? teleFee : null,
        followUpFeeInClinic: toOptionalNumber(feesForm.inClinic.followUpFee),
        followUpFeeTele: teleOn ? toOptionalNumber(feesForm.tele.followUpFee) : null,
        freeFollowUpDaysInClinic: toOptionalNumber(feesForm.inClinic.freeFollowUpDays),
        freeFollowUpDaysTele: teleOn ? toOptionalNumber(feesForm.tele.freeFollowUpDays) : null,
        feeCurrency: currency,
        teleDisabled: !teleOn,
      });
      const doctorId = Number(getAuthDoctorId() || 0);
      if (doctorId > 0 && Number.isFinite(teleFee) && teleFee > 0) {
        try {
          await saveFee({
            doctorId,
            inClinicFee: presentFee,
            teleFee,
            instantSurcharge: 0,
            currency,
            payAtClinicEnabled: true,
            effectiveFrom: new Date().toISOString().slice(0, 10),
          });
        } catch {
          // Profile row already saved; fee history sync is best-effort.
        }
      }
      showSaveResult(true, "Consultation fees have been updated.");
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Fee save failed.");
    }
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
    setPhotoFile(file);
    setProfilePhoto((prev) => {
      if (prev && prev !== defaultAvatar && typeof prev === "string" && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  };

  const handleRemovePhoto = async () => {
    if (photoFile) {
      setPhotoFile(null);
    } else {
      try {
        await removeDoctorProfilePhoto();
        notifyProfilePhotoChanged();
      } catch (err) {
        showSaveResult(false, typeof err === "string" ? err : err?.message || "Could not remove photo.");
        return;
      }
    }
    setProfilePhoto((prev) => {
      if (prev && prev !== defaultAvatar && typeof prev === "string" && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return defaultAvatar;
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

  const handleSavePhoto = async (event) => {
    event.preventDefault();
    if (!photoFile) {
      showSaveResult(true, "No new photo selected.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      await uploadDoctorProfilePhoto(formData);
      setPhotoFile(null);
      notifyProfilePhotoChanged();
      showSaveResult(true, "Doctor profile photo has been updated.");
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Photo upload failed.");
    }
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

    setQualificationForm((prev) => ({
      ...prev,
      documentName: file.name,
      documentFile: file,
    }));
  };

  const handleSaveQualifications = async (event) => {
    event.preventDefault();
    await loadQualifications();
    showSaveResult(true, "Qualifications are saved. Each row is stored as soon as you add or update it.");
  };

  const buildQualificationFormData = () => {
    const formData = new FormData();
    if (qualificationForm.documentFile) formData.append("file", qualificationForm.documentFile);
    formData.append("documentType", "Qualification");
    formData.append("degree", qualificationForm.degree.trim());
    formData.append("specialization", qualificationForm.specialization.trim());
    formData.append("institution", qualificationForm.institution.trim());
    formData.append("passingYear", qualificationForm.year.trim());
    return formData;
  };

  const handleAddOrUpdateQualification = async (event) => {
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

    const isEdit = editingQualificationId != null;
    if (!isEdit && !qualificationForm.documentFile) {
      Swal.fire({
        title: "Certificate required",
        text: "Attach the certificate (PDF, JPG or PNG) before adding the qualification.",
        icon: "warning",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setQualificationBusy(true);
    try {
      if (isEdit) {
        await updateDoctorCredentialDocument(editingQualificationId, buildQualificationFormData());
      } else {
        await uploadDoctorCredentialDocument(buildQualificationFormData());
      }
      resetQualificationForm();
      await loadQualifications();
      Swal.fire({
        title: isEdit ? "Updated!" : "Added!",
        text: isEdit
          ? "Qualification has been updated."
          : "Qualification has been added. It stays Pending until Admin reviews it.",
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Qualification save failed.");
    } finally {
      setQualificationBusy(false);
    }
  };

  const handleEditQualification = (item) => {
    setEditingQualificationId(item.id);
    setQualificationForm({
      degree: item.degree || "",
      specialization: item.specialization === "—" ? "" : item.specialization || "",
      institution: item.institution || "",
      year: item.year || "",
      documentName: item.documentName || "",
      documentFile: null,
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
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await deleteDoctorCredentialDocument(item.id);
      } catch (err) {
        showSaveResult(false, typeof err === "string" ? err : err?.message || "Delete failed.");
        return;
      }
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
    if (!item.hasFile) {
      Swal.fire({
        title: "No document",
        text: "No certificate file is attached for this qualification.",
        icon: "info",
        timer: 1600,
        showConfirmButton: false,
      });
      return;
    }
    openCredentialDocument(item.id);
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

  const buildHoursSavePayload = (schedule) => {
    const incompleteBreak = WEEK_DAYS.some((day) => {
      const row = schedule[day.id];
      return row?.available && row.breakEnabled && (!row.breakFrom || !row.breakTo);
    });
    if (incompleteBreak) {
      return { error: "Choose both break times, or turn the break off." };
    }
    const gapMinutes = bookingRules.gapMinutes === "" ? null : Number(bookingRules.gapMinutes);
    const horizonDays = bookingRules.horizonDays === "" ? null : Number(bookingRules.horizonDays);
    if (gapMinutes != null && (!Number.isInteger(gapMinutes) || gapMinutes < 0 || gapMinutes > 240)) {
      return { error: "Gap between appointments must be a whole number from 0 to 240 minutes." };
    }
    if (horizonDays != null && (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 90)) {
      return { error: "Booking window must be a whole number from 1 to 90 days." };
    }
    const sourceDay =
      WEEK_DAYS.map((day) => schedule[day.id]).find((row) => row?.available && row.startTime && row.endTime) ||
      schedule.monday ||
      createDefaultHoursDay();
    const days = WEEK_DAYS.filter(
      (day) => schedule[day.id]?.available && schedule[day.id].startTime && schedule[day.id].endTime
    ).map((day) => {
      const row = schedule[day.id];
      return {
        scheduleDate: nextDateForWeekday(day.id),
        workStartTime: amPmToHms(row.startTime),
        workEndTime: amPmToHms(row.endTime),
        slotIntervalMinutes: 15,
        includeBreak: Boolean(row.breakEnabled),
        breakStartTime: row.breakEnabled ? amPmToHms(row.breakFrom) : null,
        breakEndTime: row.breakEnabled ? amPmToHms(row.breakTo) : null,
      };
    });
    const clearScheduleDates = WEEK_DAYS.filter((day) => !schedule[day.id]?.available).map((day) =>
      nextDateForWeekday(day.id)
    );
    return {
      payload: {
        isOnline: Boolean(consultationMode.teleconsultation || consultationMode.both),
        workingHoursNote: `Mon-Sat ${sourceDay.startTime || "09:00 AM"}-${sourceDay.endTime || "01:00 PM"}`,
        gapMinutes,
        bookingHorizonDays: horizonDays,
        days,
        clearScheduleDates,
      },
      workingHoursNote: `Mon-Sat ${sourceDay.startTime || "09:00 AM"}-${sourceDay.endTime || "01:00 PM"}`,
    };
  };

  const persistHoursSchedule = async (schedule, successText) => {
    if (
      !isReceptionUser &&
      !consultationMode.inClinic &&
      !consultationMode.teleconsultation
    ) {
      showSaveResult(false, "Please enable In-Clinic, Teleconsultation, or Both.");
      return false;
    }
    if (isReceptionUser) {
      showSaveResult(true, `Working hours have been updated for ${profileSubjectName}.`);
      return true;
    }
    const built = buildHoursSavePayload(schedule);
    if (built.error) {
      showSaveResult(false, built.error);
      return false;
    }
    try {
      const saved = await updateAvailabilityMe(built.payload);
      await updateDoctorProfileMe({
        workingHoursNote: built.workingHoursNote,
      });
      const me = saved?.data ?? saved;
      if (me) {
        setBookingRules({
          gapMinutes: me?.gapMinutes ?? me?.GapMinutes ?? bookingRules.gapMinutes,
          horizonDays: me?.bookingHorizonDays ?? me?.BookingHorizonDays ?? bookingRules.horizonDays,
        });
        const rows = me?.weekSchedules ?? me?.WeekSchedules ?? [];
        if (Array.isArray(rows)) {
          setHoursSchedule(() => {
            const next = WEEK_DAYS.reduce(
              (acc, day) => ({ ...acc, [day.id]: { ...UNAVAILABLE_DAY } }),
              {}
            );
            rows.forEach((row) => {
              const id = weekdayIdFromDate(row.scheduleDate || row.ScheduleDate);
              if (!id) return;
              const start = hmsToAmPm(row.workStartTime || row.WorkStartTime);
              const end = hmsToAmPm(row.workEndTime || row.WorkEndTime);
              const breakFrom = hmsToAmPm(row.breakStartTime || row.BreakStartTime);
              const breakTo = hmsToAmPm(row.breakEndTime || row.BreakEndTime);
              next[id] = {
                ...createDefaultHoursDay(),
                available: true,
                startTime: start,
                endTime: end,
                breakEnabled: Boolean(breakFrom && breakTo),
                breakFrom,
                breakTo,
              };
            });
            return next;
          });
        }
      }
      dispatchDoctorScheduleChanged({ source: "profile-hours" });
      showSaveResult(true, successText);
      return true;
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Hours save failed.");
      return false;
    }
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

  const handleSaveHours = async (event) => {
    event.preventDefault();
    await persistHoursSchedule(hoursSchedule, "Clinic hours have been updated.");
  };

  const updateBankField = (field, value) => {
    setBankForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBank = async (event) => {
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

    try {
      await updateDoctorProfileMe({
        kyc: {
          accountHolder: bankForm.accountHolderName.trim(),
          bankName: bankForm.bankName.trim(),
          accountNumber: bankForm.accountNumber.trim(),
          ifsc: bankForm.ifscCode.trim().toUpperCase(),
          branchName: (bankForm.branchName || "").trim(),
          accountType: bankForm.accountType.trim(),
          pan: (bankForm.pan || "").trim().toUpperCase(),
        },
      });
      showSaveResult(true, "Bank details have been updated.");
    } catch (err) {
      showSaveResult(false, typeof err === "string" ? err : err?.message || "Bank save failed.");
    }
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
      {(value && !HOUR_TIME_OPTIONS.includes(value) ? [value, ...HOUR_TIME_OPTIONS] : HOUR_TIME_OPTIONS).map((time) => (
        <option key={`${dayId}-${field}-${time}`} value={time}>
          {time}
        </option>
      ))}
    </Input>
  );

  const displayName = profileSubjectName;
  const visibleTabs = getProfileTabsForRole(userData?.role);

  document.title = isReceptionProfile
    ? "Reception profile | Niga Homeocentrum"
    : isPatientProfile
      ? "Patient profile | Niga Homeocentrum"
    : "Profile | Niga Homeocentrum";

  if (isPatientProfile) {
    return (
      <div className="page-content user-profile-page doctor-dashboard-page">
        <Container fluid>
          <Row>
            <Col lg={8}>
              <Card className="user-profile-card doctor-stats-card">
                <CardBody>
                  <h5 className="mb-1">Patient profile</h5>
                  <p className="text-muted">
                    Update your personal and medical details, and manage privacy consent.
                  </p>
                  <PatientProfileFields />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (isReceptionProfile) {
    return (
      <div className="page-content user-profile-page doctor-dashboard-page">
        <Container fluid>
          <Row>
            <Col lg={8}>
              <Card className="user-profile-card doctor-stats-card">
                <CardBody>
                  <h5 className="mb-1">Reception profile</h5>
                  <p className="text-muted">
                    Update your own name, mobile, and email. Doctor qualifications, clinic fee, and bank are not on this page.
                  </p>
                  <ReceptionProfileFields />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content user-profile-page doctor-dashboard-page">
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="user-profile-card doctor-stats-card">
              <CardBody className="user-profile-card__body">
                <div className="user-profile-page__summary">
                  <span className="user-profile-page__avatar" aria-hidden="true">
                    {profilePhoto && profilePhoto !== defaultAvatar ? (
                      <img src={profilePhoto} alt="" className="rounded-circle w-100 h-100" style={{ objectFit: "cover" }} />
                    ) : (
                      <i className="ri-user-heart-line" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h5 className="user-profile-page__summary-name text-truncate">
                      {displayName}
                    </h5>
                    <p className="user-profile-page__summary-meta">
                      <i className="ri-shield-user-line" aria-hidden="true" />
                      <span>{roleLabel}</span>
                    </p>
                    <p className="user-profile-page__summary-meta">
                      <i className="ri-mail-line" aria-hidden="true" />
                      <span>Email: {email || "Not set"}</span>
                    </p>
                    {doctorMobile ? (
                      <p className="user-profile-page__summary-meta mb-0">
                        <i className="ri-phone-line" aria-hidden="true" />
                        <span>Mobile: {doctorMobile}</span>
                      </p>
                    ) : null}
                    {userData?.role !== UserRole.DOCTOR ? (
                      <p className="user-profile-page__summary-meta mb-0">
                        <i className="ri-user-settings-line" aria-hidden="true" />
                        <span>Login: {userData?.loginId || userData?.userName || "—"}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <Nav
                  tabs
                  className="nav-tabs-custom rounded border-bottom-0 user-profile-page__tabs"
                  role="tablist"
                >
                  {visibleTabs.map((tab) => (
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
                    {isReceptionProfile ? <ReceptionProfileFields /> : userData ? (
                      <>
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                          <h5 className="user-profile-page__section-title mb-0">
                            <i className="ri-information-line" aria-hidden="true" />
                            User Information
                          </h5>
                          {userData.role !== UserRole.DOCTOR ? (
                            <div className="d-flex gap-2">
                              {editingStaffProfile ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-soft-secondary"
                                    disabled={personalSaving}
                                    onClick={() => {
                                      setPersonalForm((prev) => ({
                                        ...prev,
                                        firstName: userData.firstName || "",
                                        middleName: userData.middleName || "",
                                        lastName: userData.lastName || "",
                                        email: email || userData.email || userData.emailId || "",
                                        mobileNo: doctorMobile || userData.mobileNo || "",
                                      }));
                                      setEditingStaffProfile(false);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm clinic-primary-btn"
                                    disabled={personalSaving}
                                    onClick={handleSaveStaffProfile}
                                  >
                                    {personalSaving ? "Saving…" : "Save"}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-primary"
                                  onClick={() => {
                                    setPersonalForm((prev) => ({
                                      ...prev,
                                      firstName: userData.firstName || "",
                                      middleName: userData.middleName || "",
                                      lastName: userData.lastName || "",
                                      email: email || userData.email || userData.emailId || "",
                                      mobileNo: doctorMobile || userData.mobileNo || "",
                                    }));
                                    setEditingStaffProfile(true);
                                  }}
                                >
                                  <i className="ri-pencil-line me-1" aria-hidden="true" />
                                  Edit
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                        {editingStaffProfile && userData.role !== UserRole.DOCTOR ? (
                          <Form onSubmit={handleSaveStaffProfile}>
                            <Row className="g-3 new-patient-modal__fields">
                              <Col md={4} xs={12}>
                                <Label className="form-label new-patient-modal__label">
                                  First Name
                                  <RequiredMark />
                                </Label>
                                <Input
                                  type="text"
                                  value={personalForm.firstName}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                />
                              </Col>
                              <Col md={4} xs={12}>
                                <Label className="form-label new-patient-modal__label">Middle Name</Label>
                                <Input
                                  type="text"
                                  value={personalForm.middleName}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, middleName: e.target.value }))}
                                />
                              </Col>
                              <Col md={4} xs={12}>
                                <Label className="form-label new-patient-modal__label">
                                  Last Name
                                  <RequiredMark />
                                </Label>
                                <Input
                                  type="text"
                                  value={personalForm.lastName}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label className="form-label new-patient-modal__label">Email</Label>
                                <Input
                                  type="email"
                                  value={personalForm.email}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, email: e.target.value }))}
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label className="form-label new-patient-modal__label">Mobile</Label>
                                <Input
                                  type="text"
                                  value={personalForm.mobileNo}
                                  onChange={(e) =>
                                    setPersonalForm((prev) => ({
                                      ...prev,
                                      mobileNo: e.target.value.replace(/[^\d+]/g, ""),
                                    }))
                                  }
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label className="form-label new-patient-modal__label">Login ID</Label>
                                <Input value={userData.loginId || userData.userName || "—"} disabled />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label className="form-label new-patient-modal__label">Role</Label>
                                <Input value={roleLabel} disabled />
                              </Col>
                            </Row>
                          </Form>
                        ) : (
                        <Row className="g-3 new-patient-modal__fields user-profile-page__info-grid">
                          <ProfileInfoField icon="ri-user-line" label="Full Name">
                            {[userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(" ") || userData.displayName || userData.userName || "—"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-user-3-line" label="First Name">
                            {userData.firstName || "—"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-user-4-line" label="Last Name">
                            {userData.lastName || "—"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-mail-line" label="Email">
                            {email || "Not set"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-phone-line" label="Mobile">
                            {doctorMobile || userData.mobileNo || userData.mobile || "—"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-user-settings-line" label="Login ID">
                            {userData.loginId || userData.userName || "—"}
                          </ProfileInfoField>
                          <ProfileInfoField icon="ri-shield-user-line" label="Role">
                            <ProfileBadge tone="info">{roleLabel}</ProfileBadge>
                          </ProfileInfoField>
                          {userData.role !== UserRole.DOCTOR ? (
                            <ProfileInfoField icon="ri-account-circle-line" label="User name">
                              {userData.userName || userData.loginId || userData.displayName || "—"}
                            </ProfileInfoField>
                          ) : null}
                          {userData.verificationStatus ? (
                            <ProfileInfoField icon="ri-shield-check-line" label="Verification">
                              <ProfileBadge tone={/approved/i.test(userData.verificationStatus) ? "success" : "warning"}>
                                {userData.verificationStatus}
                              </ProfileBadge>
                            </ProfileInfoField>
                          ) : null}
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
                          {userData.packageName ? (
                            <ProfileInfoField icon="ri-vip-diamond-line" label="Package">
                              {userData.packageName}
                            </ProfileInfoField>
                          ) : null}
                          {userData.role === UserRole.DOCTOR ? (
                            <ProfileInfoField icon="ri-hospital-line" label="Practice activated">
                              <ProfileBadge tone={userData.practiceActivated ? "success" : "neutral"}>
                                {userData.practiceActivated ? "Yes" : "No"}
                              </ProfileBadge>
                            </ProfileInfoField>
                          ) : null}
                          {userData.role === UserRole.DOCTOR && ranking?.score != null ? (
                            <ProfileInfoField icon="ri-bar-chart-line" label="Find a Doctor score">
                              {ranking.score}
                              {ranking.parts ? ` · verified ${ranking.parts.verified ?? "—"}, rating ${ranking.parts.averageRating ?? "—"}, fee factor ${ranking.parts.feeFactor ?? "—"}` : ""}
                            </ProfileInfoField>
                          ) : null}
                          {(userData.firmNames || userData.firmName) ? (
                            <ProfileInfoField icon="ri-building-line" label="Firms">
                              {userData.firmNames || userData.firmName}
                            </ProfileInfoField>
                          ) : null}
                        </Row>
                        )}
                      </>
                    ) : null}

                    {userData?.role === UserRole.DOCTOR ? (
                      <>
                        <div className="user-profile-page__divider" />
                        <Form onSubmit={handleSavePersonal}>
                          <div className="user-profile-page__row-section">
                            <h5 className="user-profile-page__section-title">
                              <i className="ri-edit-line" aria-hidden="true" />
                              Personal Details
                            </h5>
                            <Row className="g-3 new-patient-modal__fields">
                              <Col md={4} xs={12}>
                                <Label htmlFor="profileFirstName" className="form-label new-patient-modal__label">
                                  First Name
                                  <RequiredMark />
                                </Label>
                                <Input
                                  id="profileFirstName"
                                  type="text"
                                  value={personalForm.firstName}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                />
                              </Col>
                              <Col md={4} xs={12}>
                                <Label htmlFor="profileMiddleName" className="form-label new-patient-modal__label">
                                  Middle Name
                                </Label>
                                <Input
                                  id="profileMiddleName"
                                  type="text"
                                  value={personalForm.middleName}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, middleName: e.target.value }))}
                                />
                              </Col>
                              <Col md={4} xs={12}>
                                <Label htmlFor="profileLastName" className="form-label new-patient-modal__label">
                                  Last Name
                                  <RequiredMark />
                                </Label>
                                <Input
                                  id="profileLastName"
                                  type="text"
                                  value={personalForm.lastName}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label htmlFor="profileEmail" className="form-label new-patient-modal__label">
                                  Email
                                </Label>
                                <Input
                                  id="profileEmail"
                                  type="email"
                                  value={personalForm.email}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, email: e.target.value }))}
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label htmlFor="profileMobile" className="form-label new-patient-modal__label">
                                  Mobile
                                </Label>
                                <Input
                                  id="profileMobile"
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={15}
                                  value={personalForm.mobileNo}
                                  onChange={(e) =>
                                    setPersonalForm((prev) => ({ ...prev, mobileNo: e.target.value.replace(/[^\d+]/g, "") }))
                                  }
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label htmlFor="profileRegistrationNo" className="form-label new-patient-modal__label">
                                  Registration / certificate number
                                </Label>
                                <Input
                                  id="profileRegistrationNo"
                                  type="text"
                                  value={personalForm.registrationNo}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, registrationNo: e.target.value }))}
                                />
                              </Col>
                              <Col md={6} xs={12}>
                                <Label htmlFor="profileCasePaperValidity" className="form-label new-patient-modal__label">
                                  Case paper validity (days)
                                </Label>
                                <Input
                                  id="profileCasePaperValidity"
                                  type="number"
                                  min="1"
                                  value={personalForm.casePaperValidity}
                                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, casePaperValidity: e.target.value }))}
                                />
                              </Col>
                              <Col md={6} xs={12} className="d-flex align-items-end">
                                <Label check className="mb-2">
                                  <Input
                                    type="checkbox"
                                    checked={Boolean(personalForm.practiceActivated)}
                                    onChange={(e) => setPersonalForm((prev) => ({ ...prev, practiceActivated: e.target.checked }))}
                                  />{" "}
                                  Practice activated
                                </Label>
                              </Col>
                            </Row>
                          </div>
                          <div className="user-profile-page__form-footer">
                            <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                              Cancel
                            </ModalActionButton>
                            <ModalActionButton action="update" type="submit" disabled={personalSaving}>
                              {personalSaving ? "Saving..." : "Update"}
                            </ModalActionButton>
                          </div>
                        </Form>
                      </>
                    ) : null}
                  </TabPane>

                  <TabPane tabId="clinic">
                    <Form onSubmit={handleSaveClinic}>
                      <h5 className="user-profile-page__section-title">
                        <i className="ri-hospital-line" aria-hidden="true" />
                        Clinic Information
                      </h5>
                      <p className="text-muted small mb-3">
                        Managing clinic details for <strong>{profileSubjectName}</strong>
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
                          <Label htmlFor="clinicCountry" className="form-label new-patient-modal__label">
                            Country
                            <RequiredMark />
                          </Label>
                          <Input id="clinicCountry" type="select" value={clinicForm.countryId} onChange={(e) => chooseCountry(e.target.value)}>
                            <option value="">Select country</option>
                            {countries.map((row) => (
                              <option key={row.id} value={row.id}>{row.name}</option>
                            ))}
                          </Input>
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicState" className="form-label new-patient-modal__label">
                            State
                            <RequiredMark />
                          </Label>
                          <Input id="clinicState" type="select" value={clinicForm.stateId} onChange={(e) => chooseState(e.target.value)}>
                            <option value="">Select state</option>
                            {clinicForm.stateId && !locationStates.some((row) => String(row.id) === String(clinicForm.stateId)) ? (
                              <option value={clinicForm.stateId}>{clinicForm.state || "Saved state"}</option>
                            ) : null}
                            {locationStates.map((row) => (
                              <option key={row.id} value={row.id}>{row.name}</option>
                            ))}
                          </Input>
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicDistrict" className="form-label new-patient-modal__label">
                            District
                            <RequiredMark />
                          </Label>
                          <Input id="clinicDistrict" type="select" value={clinicForm.districtId} onChange={(e) => chooseDistrict(e.target.value)}>
                            <option value="">Select district</option>
                            {districts.map((row) => (
                              <option key={row.id} value={row.id}>{row.name}</option>
                            ))}
                          </Input>
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicCity" className="form-label new-patient-modal__label">
                            City
                            <RequiredMark />
                          </Label>
                          <Input id="clinicCity" type="select" value={clinicForm.cityId} onChange={(e) => chooseCity(e.target.value)}>
                            <option value="">Select city</option>
                            {clinicForm.cityId && !cities.some((row) => String(row.id) === String(clinicForm.cityId)) ? (
                              <option value={clinicForm.cityId}>{clinicForm.city || "Saved city"}</option>
                            ) : null}
                            {cities.map((row) => (
                              <option key={row.id} value={row.id}>{row.name}</option>
                            ))}
                          </Input>
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                          <Label htmlFor="clinicPincode" className="form-label new-patient-modal__label">
                            Pincode
                            <RequiredMark />
                          </Label>
                          <Input id="clinicPincode" type="select" value={clinicForm.pinCodeId} onChange={(e) => choosePin(e.target.value)}>
                            <option value="">Select pincode</option>
                            {clinicForm.pinCodeId && !pinCodes.some((row) => String(row.id) === String(clinicForm.pinCodeId)) ? (
                              <option value={clinicForm.pinCodeId}>{clinicForm.pincode || "Saved pincode"}</option>
                            ) : null}
                            {pinCodes.map((row) => (
                              <option key={row.id} value={row.id}>{row.name}</option>
                            ))}
                          </Input>
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
                              Present
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
                              <option value="">Select currency</option>
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
                              <option value="">Select currency</option>
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
                          {isReceptionUser ? "Receptionist Profile Photo" : "Doctor Profile Photo"}
                        </h5>

                        <div className="user-profile-page__photo-body text-center">
                          <div className="user-profile-page__photo-preview-wrap">
                            <img
                              src={profilePhoto || defaultAvatar}
                              alt={isReceptionUser ? "Receptionist profile" : "Doctor profile"}
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
                            disabled={qualificationBusy}
                          >
                            {qualificationBusy ? "Saving..." : editingQualificationId != null ? "Update" : "Add Qualification"}
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
                                  {item.hasFile ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-soft-info user-profile-page__qualification-view-btn"
                                      title={item.documentName}
                                      onClick={() => handleViewQualificationDocument(item)}
                                    >
                                      View
                                    </button>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
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
                  <TabPane tabId="credentials">
                    {userData?.role === UserRole.DOCTOR && <DoctorCredentialsPanel />}
                  </TabPane>
                  <TabPane tabId="hours">
                    <Form onSubmit={handleSaveHours}>
                      <div className="user-profile-page__hours-card">
                        <h5 className="user-profile-page__section-title">
                          <i className="ri-time-line" aria-hidden="true" />
                          {isReceptionUser ? "Working Hours" : "Clinic Availability"}
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

                      </div>

                      {!isReceptionUser ? (
                        <div className="user-profile-page__hours-card">
                          <h5 className="user-profile-page__section-title">
                            <i className="ri-calendar-close-line" aria-hidden="true" />
                            Time off
                          </h5>
                          <Row className="g-3 new-patient-modal__fields mb-3">
                            <Col md={3} xs={12}>
                              <Label htmlFor="timeOffStart" className="form-label new-patient-modal__label">From</Label>
                              <Input id="timeOffStart" type="date" value={timeOffForm.start} onChange={(e) => setTimeOffForm((prev) => ({ ...prev, start: e.target.value }))} />
                            </Col>
                            <Col md={3} xs={12}>
                              <Label htmlFor="timeOffEnd" className="form-label new-patient-modal__label">To</Label>
                              <Input id="timeOffEnd" type="date" value={timeOffForm.end} onChange={(e) => setTimeOffForm((prev) => ({ ...prev, end: e.target.value }))} />
                            </Col>
                            <Col md={4} xs={12}>
                              <Label htmlFor="timeOffReason" className="form-label new-patient-modal__label">Reason</Label>
                              <Input id="timeOffReason" type="text" value={timeOffForm.reason} onChange={(e) => setTimeOffForm((prev) => ({ ...prev, reason: e.target.value }))} />
                            </Col>
                            <Col md={2} xs={12} className="d-flex align-items-end">
                              <ModalActionButton action="add" type="button" disabled={timeOffBusy} onClick={handleAddTimeOff}>
                                {timeOffBusy ? "Saving..." : "Add"}
                              </ModalActionButton>
                            </Col>
                          </Row>
                          {timeOffRows.length ? (
                            <div className="table-responsive">
                              <table className="table align-middle mb-0">
                                <thead>
                                  <tr>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Reason</th>
                                    <th />
                                  </tr>
                                </thead>
                                <tbody>
                                  {timeOffRows.map((row) => {
                                    const id = row.doctorTimeOffId ?? row.DoctorTimeOffId;
                                    const from = String(row.startsAt ?? row.StartsAt ?? "").slice(0, 10);
                                    const to = String(row.endsAt ?? row.EndsAt ?? "").slice(0, 10);
                                    return (
                                      <tr key={id}>
                                        <td>{from}</td>
                                        <td>{to}</td>
                                        <td>{row.reason || row.Reason || ""}</td>
                                        <td className="text-end">
                                          <button type="button" className="btn btn-sm btn-soft-danger" disabled={timeOffBusy} onClick={() => handleDeleteTimeOff(id)}>
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted mb-0">No leave dates saved.</p>
                          )}
                        </div>
                      ) : null}

                      {!isReceptionUser ? (
                        <div className="user-profile-page__hours-card mb-3">
                          <h5 className="user-profile-page__section-title">
                            <i className="ri-timer-line" aria-hidden="true" />
                            Booking rules
                          </h5>
                          <Row className="g-3">
                            <Col md={4}>
                              <Label htmlFor="bookingGap">Gap between appointments (minutes)</Label>
                              <Input
                                id="bookingGap"
                                type="number"
                                min="0"
                                max="240"
                                value={bookingRules.gapMinutes}
                                onChange={(e) => setBookingRules((prev) => ({ ...prev, gapMinutes: e.target.value }))}
                              />
                            </Col>
                            <Col md={4}>
                              <Label htmlFor="bookingHorizon">Days ahead a patient can book</Label>
                              <Input
                                id="bookingHorizon"
                                type="number"
                                min="1"
                                max="90"
                                value={bookingRules.horizonDays}
                                onChange={(e) => setBookingRules((prev) => ({ ...prev, horizonDays: e.target.value }))}
                              />
                            </Col>
                          </Row>
                        </div>
                      ) : null}

                      {!isReceptionUser ? (
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
                      ) : null}

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
                            {bankForm.bankName && !BANK_NAME_OPTIONS.includes(bankForm.bankName) ? (
                              <option value={bankForm.bankName}>{bankForm.bankName}</option>
                            ) : null}
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
                          <Label htmlFor="bankPan" className="form-label new-patient-modal__label">
                            PAN
                          </Label>
                          <Input
                            id="bankPan"
                            type="text"
                            maxLength={10}
                            value={bankForm.pan}
                            onChange={(e) => updateBankField("pan", e.target.value.toUpperCase())}
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
                        <span>
                          {isReceptionUser
                            ? "Your bank details are securely stored for salary and reimbursement purposes only."
                            : "Your bank details are securely stored and used for payout purposes only."}
                        </span>
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
                  <TabPane tabId="reviews">
                    {activeTab === "reviews" ? <DoctorReviewsPanel /> : null}
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
