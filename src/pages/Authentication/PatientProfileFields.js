import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Alert, Button, Col, FormFeedback, Input, Label, Row, Spinner } from "reactstrap";
import {
  getConsentNotice,
  getPatientProfileMe,
  getPrivacyConsentStatus,
  grantPrivacyConsent,
  savePatientProfileMe,
} from "../../helpers/realbackend_helper";
import { getPatientProfileS4, putPatientProfileS4 } from "../../helpers/s4Week4Api";

const emptyForm = { firstName: "", lastName: "", mobileNo: "", email: "", dateOfBirth: "", gender: "" };
const emptyHealth = {
  bloodGroup: "",
  allergies: "",
  chronicConditions: "",
  emergencyContactName: "",
  emergencyContactMobile: "",
};
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Unknown"];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
});

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
      setForm(formFromProfile(unwrap(profileRes)));
      setHealth(healthFromProfile(unwrap(healthRes)));
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
      };
      const response = await savePatientProfileMe(payload);
      const saved = unwrap(response);
      const nextForm = saved && typeof saved === "object" && (saved.firstName || saved.FirstName) ? formFromProfile(saved) : form;
      setForm(nextForm);
      syncSessionUser(nextForm);
      setSaveNote("Profile saved.");
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

  return (
    <>
      {loadError ? <Alert color="danger">{loadError}</Alert> : null}
      <h5 className="user-profile-page__section-title mb-3">
        <i className="ri-user-heart-line" aria-hidden="true" />
        Personal details
      </h5>
      {saveError ? <Alert color="danger">{saveError}</Alert> : null}
      {saveNote ? <Alert color="success">{saveNote}</Alert> : null}
      <Row className="g-3">
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
        <Col md={6}>
          <Label>Gender</Label>
          <Input type="select" value={String(form.gender)} onChange={(e) => setField("gender", e.target.value)}>
            <option value="">Select</option>
            <option value="0">Male</option>
            <option value="1">Female</option>
          </Input>
        </Col>
      </Row>
      <Button className="mt-3" color="primary" disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save profile"}
      </Button>

      <div className="user-profile-page__divider my-4" />
      <h5 className="user-profile-page__section-title mb-3">
        <i className="ri-health-book-line" aria-hidden="true" />
        Medical details
      </h5>
      {healthError ? <Alert color="danger">{healthError}</Alert> : null}
      {healthNote ? <Alert color="success">{healthNote}</Alert> : null}
      <Row className="g-3">
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
      <Button className="mt-3" color="primary" outline disabled={savingHealth} onClick={saveHealth}>
        {savingHealth ? "Saving…" : "Save medical details"}
      </Button>

      <div className="user-profile-page__divider my-4" />
      <h5 className="user-profile-page__section-title mb-2">
        <i className="ri-shield-check-line" aria-hidden="true" />
        Privacy consent
      </h5>
      <p className="text-muted">
        {privacyGranted
          ? `Privacy consent is granted (notice version ${privacyStatus?.grantedNoticeVersion || "on file"}${
              privacyStatus?.grantedForMinor && privacyStatus?.guardianName ? `, given by guardian ${privacyStatus.guardianName}` : ""
            }).`
          : privacyStatus?.isMinor
            ? "This profile belongs to someone under 18. A parent or legal guardian must give privacy consent from their family account (Family page) or at the clinic."
            : privacyStatus?.reconsentRequired
              ? "The privacy notice has changed since you last consented. Please read the current version and consent again."
              : "Read the privacy notice below and grant consent so the clinic can keep your case records."}
      </p>
      {privacyNotice ? (
        <details className="mb-3">
          <summary>
            {privacyNotice.title || "Privacy notice"} (version {privacyNotice.version})
          </summary>
          <div className="border rounded p-2 mt-2 small" style={{ whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto" }}>
            {privacyNotice.body}
          </div>
        </details>
      ) : null}
      {privacyNote ? <Alert color={privacyGranted ? "success" : "danger"}>{privacyNote}</Alert> : null}
      <Button
        color="success"
        disabled={privacyBusy || privacyGranted || Boolean(privacyStatus?.isMinor) || !privacyNotice}
        onClick={grantPrivacy}
      >
        {privacyBusy ? "Saving…" : privacyGranted ? "Granted" : "I have read the notice and consent"}
      </Button>
    </>
  );
};

export default PatientProfileFields;
