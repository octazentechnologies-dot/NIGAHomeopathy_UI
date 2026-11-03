import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Alert, Col, FormFeedback, Input, Label, Nav, NavItem, NavLink, Row, Spinner } from "reactstrap";
import ModalActionButton from "../../Components/Common/ModalActionButton";
import {
  getConsentNotice,
  getPatientProfileMe,
  getPrivacyConsentStatus,
  getRegistrationCities,
  getRegistrationCountries,
  getRegistrationDistricts,
  getRegistrationPinCodes,
  getRegistrationStates,
  grantPrivacyConsent,
  savePatientProfileMe,
} from "../../helpers/realbackend_helper";
import { getPatientProfileS4, putPatientProfileS4 } from "../../helpers/s4Week4Api";

const emptyForm = {
  firstName: "", lastName: "", mobileNo: "", email: "", dateOfBirth: "", gender: "",
  countryId: "", stateId: "", districtId: "", cityId: "", pinCodeId: "",
};
const emptyHealth = {
  bloodGroup: "",
  allergies: "",
  chronicConditions: "",
  emergencyContactName: "",
  emergencyContactMobile: "",
};
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Unknown"];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const genderText = (value) => {
  const text = String(value);
  if (text === "0") return "Male";
  if (text === "1") return "Female";
  return "—";
};

const formatDob = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const lookupName = (rows, id) => {
  if (id == null || id === "") return "—";
  return rows.find((row) => String(row.id) === String(id))?.name || "—";
};

const InfoField = ({ label, children }) => (
  <Col lg={4} md={6} xs={12}>
    <div className="user-profile-page__field">
      <Label className="form-label user-profile-page__label">{label}</Label>
      <div className="user-profile-page__value">{children || "—"}</div>
    </div>
  </Col>
);

const SectionHead = ({ title, editing, onEdit }) => (
  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
    <h5 className="user-profile-page__section-title mb-0">{title}</h5>
    {!editing ? (
      <button type="button" className="btn btn-sm btn-soft-primary" onClick={onEdit}>
        <i className="ri-pencil-line me-1" aria-hidden="true" />
        Edit
      </button>
    ) : null}
  </div>
);

const unwrap = (response) => {
  const body = response?.data ?? response;
  return body?.data ?? body?.Data ?? body;
};

const errorText = (err, fallback) => {
  if (typeof err === "string" && err.trim()) return err;
  return err?.data?.message || err?.message || fallback;
};

const toDateInput = (value) => {
  if (!value) return "";
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
};

const formFromProfile = (me) => ({
  firstName: me?.firstName || me?.FirstName || "",
  lastName: me?.lastName || me?.LastName || "",
  mobileNo: me?.mobileNo || me?.MobileNo || "",
  email: me?.email || me?.Email || "",
  dateOfBirth: toDateInput(me?.dateOfBirth ?? me?.DateOfBirth),
  gender: me?.gender ?? me?.Gender ?? "",
  countryId: me?.countryId ? String(me.countryId) : "",
  stateId: me?.stateId ? String(me.stateId) : "",
  districtId: me?.districtId ? String(me.districtId) : "",
  cityId: me?.cityId ? String(me.cityId) : "",
  pinCodeId: me?.pinCodeId ? String(me.pinCodeId) : "",
});

const masterOptions = (rows, idKeys, nameKeys) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: Number(idKeys.map((key) => row?.[key]).find((value) => value != null && value !== "")),
      name: String(nameKeys.map((key) => row?.[key]).find(Boolean) || "").trim(),
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.name);

const healthFromProfile = (row) => ({
  bloodGroup: row?.bloodGroup || row?.BloodGroup || "",
  allergies: row?.allergies || row?.Allergies || "",
  chronicConditions: row?.chronicConditions || row?.ChronicConditions || "",
  emergencyContactName: row?.emergencyContactName || row?.EmergencyContactName || "",
  emergencyContactMobile: row?.emergencyContactMobile || row?.EmergencyContactMobile || "",
});

const syncSessionUser = (form) => {
  try {
    const raw = sessionStorage.getItem("authUser");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const apply = (target) => {
      if (!target || typeof target !== "object") return;
      target.firstName = form.firstName;
      target.lastName = form.lastName;
      target.email = form.email;
      target.mobileNo = form.mobileNo;
      if (fullName) target.displayName = fullName;
    };
    apply(parsed);
    if (parsed.data && typeof parsed.data === "object") apply(parsed.data);
    sessionStorage.setItem("authUser", JSON.stringify(parsed));
  } catch (_) {
    /* ignore */
  }
};

const PatientProfileFields = () => {
  const [form, setForm] = useState(emptyForm);
  const [health, setHealth] = useState(emptyHealth);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [healthError, setHealthError] = useState("");
  const [healthNote, setHealthNote] = useState("");
  const [savingHealth, setSavingHealth] = useState(false);
  const [privacyGranted, setPrivacyGranted] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState(null);
  const [privacyNotice, setPrivacyNotice] = useState(null);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyNote, setPrivacyNote] = useState("");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [pins, setPins] = useState([]);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalSnapshot, setPersonalSnapshot] = useState(null);
  const [editingHealth, setEditingHealth] = useState(false);
  const [healthSnapshot, setHealthSnapshot] = useState(null);

  const loadPrivacy = async () => {
    const [privacyRes, noticeRes] = await Promise.all([
      getPrivacyConsentStatus().catch(() => null),
      getConsentNotice("Privacy").catch(() => null),
    ]);
    const privacy = unwrap(privacyRes) || privacyRes;
    setPrivacyStatus(privacy || null);
    setPrivacyGranted(Boolean(privacy?.granted ?? privacy?.Granted ?? privacy?.isGranted ?? privacy?.privacyGranted));
    setPrivacyNotice(unwrap(noticeRes) || null);
  };

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [profileRes, healthRes] = await Promise.all([
        getPatientProfileMe(),
        getPatientProfileS4().catch(() => null),
        loadPrivacy(),
      ]);
      const nextForm = formFromProfile(unwrap(profileRes));
      setForm(nextForm);
      setHealth(healthFromProfile(unwrap(healthRes)));
      const countryList = masterOptions(await getRegistrationCountries().catch(() => []), ["countryId", "CountryId"], ["countryName", "CountryName"]);
      setCountries(countryList);
      if (nextForm.countryId) {
        setStates(masterOptions(await getRegistrationStates(nextForm.countryId).catch(() => []), ["stateId", "StateId"], ["stateName", "StateName"]));
      }
      if (nextForm.stateId) {
        setDistricts(masterOptions(await getRegistrationDistricts(nextForm.stateId).catch(() => []), ["districtId", "DistrictId"], ["districtName", "DistrictName"]));
      }
      if (nextForm.districtId) {
        setCities(masterOptions(await getRegistrationCities(nextForm.districtId).catch(() => []), ["cityId", "CityId"], ["cityName", "CityName"]));
      }
      if (nextForm.cityId) {
        const pinRows = await getRegistrationPinCodes(nextForm.cityId).catch(() => []);
        setPins((Array.isArray(pinRows) ? pinRows : []).map((row) => ({
          id: row.pinCodeId || row.PinCodeId,
          name: String(row.pinCode || row.PinCode || ""),
        })).filter((row) => row.id && row.name));
      }
    } catch (err) {
      setLoadError(errorText(err, "Profile could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSaveNote("");
  };

  const setHealthField = (key, value) => {
    setHealth((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setHealthNote("");
  };

  const save = async () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    const mobileDigits = form.mobileNo.replace(/\D/g, "");
    if (form.mobileNo.trim() && (mobileDigits.length < 10 || mobileDigits.length > 15)) {
      next.mobileNo = "Enter a valid mobile number.";
    }
    if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.dateOfBirth && form.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      next.dateOfBirth = "Date of birth cannot be in the future.";
    }
    setErrors(next);
    setSaveError("");
    setSaveNote("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobileNo: form.mobileNo.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender === "" ? null : Number(form.gender),
        countryId: form.countryId ? Number(form.countryId) : 0,
        stateId: form.stateId ? Number(form.stateId) : 0,
        districtId: form.districtId ? Number(form.districtId) : 0,
        cityId: form.cityId ? Number(form.cityId) : 0,
        pinCodeId: form.pinCodeId ? Number(form.pinCodeId) : 0,
      };
      const response = await savePatientProfileMe(payload);
      const saved = unwrap(response);
      const nextForm = saved && typeof saved === "object" && (saved.firstName || saved.FirstName) ? formFromProfile(saved) : form;
      setForm(nextForm);
      syncSessionUser(nextForm);
      setSaveNote("Profile saved.");
      setEditingPersonal(false);
      setPersonalSnapshot(null);
      Swal.fire({ title: "Profile saved", icon: "success", timer: 1400, showConfirmButton: false });
    } catch (err) {
      setSaveError(errorText(err, "Could not save the profile."));
    } finally {
      setSaving(false);
    }
  };

  const saveHealth = async () => {
    const next = {};
    const emergencyDigits = health.emergencyContactMobile.replace(/\D/g, "");
    if (health.emergencyContactMobile.trim() && (emergencyDigits.length < 8 || emergencyDigits.length > 15)) {
      next.emergencyContactMobile = "Emergency mobile must be 8 to 15 digits.";
    }
    setErrors((prev) => ({ ...prev, ...next }));
    setHealthError("");
    setHealthNote("");
    if (Object.keys(next).length) return;
    setSavingHealth(true);
    try {
      const response = await putPatientProfileS4({
        bloodGroup: health.bloodGroup || null,
        allergies: health.allergies.trim() || null,
        chronicConditions: health.chronicConditions.trim() || null,
        emergencyContactName: health.emergencyContactName.trim() || null,
        emergencyContactMobile: health.emergencyContactMobile.trim() || null,
      });
      const saved = unwrap(response);
      if (saved && typeof saved === "object") setHealth(healthFromProfile(saved));
      setHealthNote("Medical details saved.");
      setEditingHealth(false);
      setHealthSnapshot(null);
      Swal.fire({ title: "Medical details saved", icon: "success", timer: 1400, showConfirmButton: false });
    } catch (err) {
      setHealthError(errorText(err, "Could not save medical details."));
    } finally {
      setSavingHealth(false);
    }
  };

  const grantPrivacy = async () => {
    setPrivacyBusy(true);
    setPrivacyNote("");
    try {
      await grantPrivacyConsent({ noticeVersion: privacyNotice?.version, noticeLanguage: privacyNotice?.language });
      await loadPrivacy();
      setPrivacyNote(`Privacy consent is recorded against notice version ${privacyNotice?.version || "current"}.`);
    } catch (err) {
      const code = err?.data?.code;
      if (code === "NOTICE_OUTDATED") {
        await loadPrivacy();
        setPrivacyNote("The privacy notice was updated while you were reading. Please read the new version and consent again.");
      } else {
        setPrivacyNote(err?.data?.message || errorText(err, "Could not record privacy consent."));
      }
    } finally {
      setPrivacyBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="text-muted py-3">
        <Spinner size="sm" /> Loading your profile…
      </div>
    );
  }

  const fullName = `${form.firstName} ${form.lastName}`.trim() || "Patient";

  return (
    <>
      {loadError ? <Alert color="danger">{loadError}</Alert> : null}
      <div className="user-profile-page__summary">
        <span className="user-profile-page__avatar" aria-hidden="true">
          <i className="ri-user-heart-line" />
        </span>
        <div className="user-profile-page__summary-main min-w-0">
          <div className="user-profile-page__summary-heading">
            <h5 className="user-profile-page__summary-name text-truncate">{fullName}</h5>
            <span className="user-profile-page__badge user-profile-page__badge--info">Patient</span>
          </div>
          <div className="user-profile-page__summary-contacts">
            <span>
              <i className="ri-mail-line" aria-hidden="true" />
              {form.email || "Not set"}
            </span>
            {form.mobileNo ? (
              <span>
                <i className="ri-phone-line" aria-hidden="true" />
                {form.mobileNo}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Nav tabs className="nav-tabs-custom rounded border-bottom-0 user-profile-page__tabs" role="tablist">
        <NavItem>
          <NavLink className="active" href="#" onClick={(event) => event.preventDefault()}>
            Profile
          </NavLink>
        </NavItem>
      </Nav>

      <div className="user-profile-page__tab-content">
      <SectionHead
        title="Personal details"
        editing={editingPersonal}
        onEdit={() => {
          setPersonalSnapshot(form);
          setSaveError("");
          setSaveNote("");
          setEditingPersonal(true);
        }}
      />
      {saveError ? <Alert color="danger">{saveError}</Alert> : null}
      {saveNote ? <Alert color="success">{saveNote}</Alert> : null}
      {editingPersonal ? (
      <>
      <Row className="g-3 user-profile-page__edit-form">
        <Col md={6}>
          <Label>First name</Label>
          <Input invalid={!!errors.firstName} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
          {errors.firstName ? <FormFeedback>{errors.firstName}</FormFeedback> : null}
        </Col>
        <Col md={6}>
          <Label>Last name</Label>
          <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
        </Col>
        <Col md={6}>
          <Label>Mobile</Label>
          <Input
            invalid={!!errors.mobileNo}
            inputMode="tel"
            value={form.mobileNo}
            onChange={(e) => setField("mobileNo", e.target.value)}
          />
          {errors.mobileNo ? <FormFeedback>{errors.mobileNo}</FormFeedback> : null}
        </Col>
        <Col md={6}>
          <Label>Email</Label>
          <Input
            type="email"
            invalid={!!errors.email}
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
          />
          {errors.email ? <FormFeedback>{errors.email}</FormFeedback> : null}
        </Col>
        <Col md={6}>
          <Label>Date of birth</Label>
          <Input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            invalid={!!errors.dateOfBirth}
            value={form.dateOfBirth}
            onChange={(e) => setField("dateOfBirth", e.target.value)}
          />
          {errors.dateOfBirth ? <FormFeedback>{errors.dateOfBirth}</FormFeedback> : null}
        </Col>
        <Col md={4}>
          <Label>Country</Label>
          <Input type="select" value={form.countryId} onChange={async (e) => {
            const countryId = e.target.value;
            setField("countryId", countryId);
            setForm((prev) => ({ ...prev, countryId, stateId: "", districtId: "", cityId: "", pinCodeId: "" }));
            setStates(countryId ? masterOptions(await getRegistrationStates(countryId).catch(() => []), ["stateId", "StateId"], ["stateName", "StateName"]) : []);
            setDistricts([]);
            setCities([]);
            setPins([]);
          }}>
            <option value="">Select</option>
            {countries.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </Input>
        </Col>
        <Col md={4}>
          <Label>State</Label>
          <Input type="select" value={form.stateId} onChange={async (e) => {
            const stateId = e.target.value;
            setForm((prev) => ({ ...prev, stateId, districtId: "", cityId: "", pinCodeId: "" }));
            setDistricts(stateId ? masterOptions(await getRegistrationDistricts(stateId).catch(() => []), ["districtId", "DistrictId"], ["districtName", "DistrictName"]) : []);
            setCities([]);
            setPins([]);
          }}>
            <option value="">Select</option>
            {states.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </Input>
        </Col>
        <Col md={4}>
          <Label>District</Label>
          <Input type="select" value={form.districtId} onChange={async (e) => {
            const districtId = e.target.value;
            setForm((prev) => ({ ...prev, districtId, cityId: "", pinCodeId: "" }));
            setCities(districtId ? masterOptions(await getRegistrationCities(districtId).catch(() => []), ["cityId", "CityId"], ["cityName", "CityName"]) : []);
            setPins([]);
          }}>
            <option value="">Select</option>
            {districts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </Input>
        </Col>
        <Col md={4}>
          <Label>City</Label>
          <Input type="select" value={form.cityId} onChange={async (e) => {
            const cityId = e.target.value;
            setForm((prev) => ({ ...prev, cityId, pinCodeId: "" }));
            const pinRows = cityId ? await getRegistrationPinCodes(cityId).catch(() => []) : [];
            setPins((Array.isArray(pinRows) ? pinRows : []).map((row) => ({
              id: row.pinCodeId || row.PinCodeId,
              name: String(row.pinCode || row.PinCode || ""),
            })).filter((row) => row.id && row.name));
          }}>
            <option value="">Select</option>
            {cities.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </Input>
        </Col>
        <Col md={4}>
          <Label>Pincode</Label>
          <Input type="select" value={form.pinCodeId} onChange={(e) => setField("pinCodeId", e.target.value)}>
            <option value="">Select</option>
            {pins.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </Input>
        </Col>
        <Col md={6}>
          <Label>Gender</Label>
          <Input type="select" value={String(form.gender)} onChange={(e) => setField("gender", e.target.value)}>
            <option value="">Select</option>
            <option value="0">Male</option>
            <option value="1">Female</option>
          </Input>
        </Col>
      </Row>
      <div className="user-profile-page__form-footer">
        <ModalActionButton
          action="cancel"
          type="button"
          disabled={saving}
          onClick={() => {
            if (personalSnapshot) setForm(personalSnapshot);
            setErrors({});
            setSaveError("");
            setEditingPersonal(false);
          }}
        >
          Cancel
        </ModalActionButton>
        <ModalActionButton action="save" type="button" disabled={saving} loading={saving} loadingLabel="Saving…" onClick={save}>
          Save
        </ModalActionButton>
      </div>
      </>
      ) : (
        <Row className="g-2 user-profile-page__info-grid">
          <InfoField label="Full name">{fullName === "Patient" && !form.firstName ? "" : fullName}</InfoField>
          <InfoField label="First name">{form.firstName}</InfoField>
          <InfoField label="Last name">{form.lastName}</InfoField>
          <InfoField label="Email">{form.email}</InfoField>
          <InfoField label="Mobile">{form.mobileNo}</InfoField>
          <InfoField label="Date of birth">{form.dateOfBirth ? formatDob(form.dateOfBirth) : ""}</InfoField>
          <InfoField label="Gender">{genderText(form.gender) === "—" ? "" : genderText(form.gender)}</InfoField>
          <InfoField label="Country">{lookupName(countries, form.countryId) === "—" ? "" : lookupName(countries, form.countryId)}</InfoField>
          <InfoField label="State">{lookupName(states, form.stateId) === "—" ? "" : lookupName(states, form.stateId)}</InfoField>
          <InfoField label="District">{lookupName(districts, form.districtId) === "—" ? "" : lookupName(districts, form.districtId)}</InfoField>
          <InfoField label="City">{lookupName(cities, form.cityId) === "—" ? "" : lookupName(cities, form.cityId)}</InfoField>
          <InfoField label="Pincode">{lookupName(pins, form.pinCodeId) === "—" ? "" : lookupName(pins, form.pinCodeId)}</InfoField>
        </Row>
      )}

      <div className="user-profile-page__divider" />
      <SectionHead
        title="Medical details"
        editing={editingHealth}
        onEdit={() => {
          setHealthSnapshot(health);
          setHealthError("");
          setHealthNote("");
          setEditingHealth(true);
        }}
      />
      {healthError ? <Alert color="danger">{healthError}</Alert> : null}
      {healthNote ? <Alert color="success">{healthNote}</Alert> : null}
      {editingHealth ? (
      <>
      <Row className="g-3 user-profile-page__edit-form">
        <Col md={4}>
          <Label>Blood group</Label>
          <Input type="select" value={health.bloodGroup} onChange={(e) => setHealthField("bloodGroup", e.target.value)}>
            <option value="">Select</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Input>
        </Col>
        <Col md={8}>
          <Label>Allergies</Label>
          <Input
            value={health.allergies}
            maxLength={500}
            placeholder="Separate with commas"
            onChange={(e) => setHealthField("allergies", e.target.value)}
          />
        </Col>
        <Col md={12}>
          <Label>Chronic conditions</Label>
          <Input
            value={health.chronicConditions}
            maxLength={500}
            placeholder="Separate with commas"
            onChange={(e) => setHealthField("chronicConditions", e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Label>Emergency contact name</Label>
          <Input
            value={health.emergencyContactName}
            maxLength={120}
            onChange={(e) => setHealthField("emergencyContactName", e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Label>Emergency contact mobile</Label>
          <Input
            inputMode="tel"
            invalid={!!errors.emergencyContactMobile}
            value={health.emergencyContactMobile}
            onChange={(e) => setHealthField("emergencyContactMobile", e.target.value)}
          />
          {errors.emergencyContactMobile ? <FormFeedback>{errors.emergencyContactMobile}</FormFeedback> : null}
        </Col>
      </Row>
      <div className="user-profile-page__form-footer">
        <ModalActionButton
          action="cancel"
          type="button"
          disabled={savingHealth}
          onClick={() => {
            if (healthSnapshot) setHealth(healthSnapshot);
            setErrors((prev) => ({ ...prev, emergencyContactMobile: "" }));
            setHealthError("");
            setEditingHealth(false);
          }}
        >
          Cancel
        </ModalActionButton>
        <ModalActionButton action="save" type="button" disabled={savingHealth} loading={savingHealth} loadingLabel="Saving…" onClick={saveHealth}>
          Save
        </ModalActionButton>
      </div>
      </>
      ) : (
        <Row className="g-2 user-profile-page__info-grid">
          <InfoField label="Blood group">{health.bloodGroup}</InfoField>
          <InfoField label="Allergies">{health.allergies}</InfoField>
          <InfoField label="Chronic conditions">{health.chronicConditions}</InfoField>
          <InfoField label="Emergency contact">{health.emergencyContactName}</InfoField>
          <InfoField label="Emergency mobile">{health.emergencyContactMobile}</InfoField>
        </Row>
      )}

      <div className="user-profile-page__divider" />
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h5 className="user-profile-page__section-title mb-0">Privacy consent</h5>
        <span className={`user-profile-page__badge user-profile-page__badge--${privacyGranted ? "success" : "warning"}`}>
          {privacyGranted ? "Granted" : "Pending"}
        </span>
      </div>
      <p className="user-profile-page__privacy-copy">
        {privacyGranted
          ? `Privacy consent is granted (notice version ${privacyStatus?.grantedNoticeVersion || "on file"}${
              privacyStatus?.grantedForMinor && privacyStatus?.guardianName ? `, given by guardian ${privacyStatus.guardianName}` : ""
            }).`
          : privacyStatus?.isMinor
            ? "This profile belongs to someone under 18. A parent or legal guardian must give privacy consent from their family account or at the clinic."
            : privacyStatus?.reconsentRequired
              ? "The privacy notice has changed since you last consented. Please read the current version and consent again."
              : "Read the privacy notice and grant consent so the clinic can keep your case records."}
      </p>
      {privacyNotice ? (
        <details className="user-profile-page__privacy-notice">
          <summary>
            {privacyNotice.title || "Privacy notice"} (version {privacyNotice.version})
          </summary>
          <div>{privacyNotice.body}</div>
        </details>
      ) : null}
      {privacyNote ? <Alert color={privacyGranted ? "success" : "danger"}>{privacyNote}</Alert> : null}
      {!privacyGranted && !privacyStatus?.isMinor ? (
        <div className="user-profile-page__form-footer">
          <ModalActionButton
            action="confirm"
            type="button"
            disabled={privacyBusy || !privacyNotice}
            loading={privacyBusy}
            loadingLabel="Saving…"
            onClick={grantPrivacy}
          >
            I have read the notice and consent
          </ModalActionButton>
        </div>
      ) : null}
      </div>
    </>
  );
};

export default PatientProfileFields;
