import React, { useEffect, useState } from "react";
import { Alert, Button, Col, FormFeedback, Input, Label, Row } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getPatientProfileMe,
  getPrivacyConsentStatus,
  grantPrivacyConsent,
  savePatientProfileMe,
} from "../../helpers/realbackend_helper";

const emptyForm = { firstName: "", lastName: "", mobileNo: "", email: "" };

const unwrap = (response) => {
  const body = response?.data ?? response;
  return body?.data ?? body?.Data ?? body;
};

const PatientProfileFields = () => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [privacyGranted, setPrivacyGranted] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyNote, setPrivacyNote] = useState("");

  const load = async () => {
    setLoadError("");
    try {
      const [profileRes, privacyRes] = await Promise.all([
        getPatientProfileMe(),
        getPrivacyConsentStatus().catch(() => null),
      ]);
      const me = unwrap(profileRes);
      setForm({
        firstName: me?.firstName || me?.FirstName || "",
        lastName: me?.lastName || me?.LastName || "",
        mobileNo: me?.mobileNo || me?.MobileNo || "",
        email: me?.email || me?.Email || "",
      });
      const privacy = unwrap(privacyRes) || privacyRes;
      const granted = Boolean(
        privacy?.granted ?? privacy?.Granted ?? privacy?.isGranted ?? privacy?.privacyGranted
      );
      setPrivacyGranted(granted);
    } catch (err) {
      setLoadError(err?.message || "Profile could not be loaded.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const save = async () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    setErrors(next);
    setSaveError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await savePatientProfileMe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobileNo: form.mobileNo.trim(),
        email: form.email.trim(),
      });
      toast.success("Profile saved.", { autoClose: 3000 });
    } catch (err) {
      setSaveError(err?.message || "Could not save the profile.");
    } finally {
      setSaving(false);
    }
  };

  const grantPrivacy = async () => {
    setPrivacyBusy(true);
    setPrivacyNote("");
    try {
      await grantPrivacyConsent();
      setPrivacyGranted(true);
      setPrivacyNote("Privacy consent is recorded.");
    } catch (err) {
      setPrivacyNote(err?.message || "Could not record privacy consent.");
    } finally {
      setPrivacyBusy(false);
    }
  };

  return (
    <>
      <ToastContainer closeButton={false} limit={1} />
      {loadError ? <Alert color="danger">{loadError}</Alert> : null}
      {saveError ? <Alert color="danger">{saveError}</Alert> : null}
      <h5 className="user-profile-page__section-title mb-3">
        <i className="ri-user-heart-line" aria-hidden="true" />
        Patient profile
      </h5>
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
          <Input value={form.mobileNo} onChange={(e) => setField("mobileNo", e.target.value)} />
        </Col>
        <Col md={6}>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
        </Col>
      </Row>
      <Button className="mt-3" color="primary" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save profile"}
      </Button>

      <div className="user-profile-page__divider my-4" />
      <h5 className="user-profile-page__section-title mb-2">
        <i className="ri-shield-check-line" aria-hidden="true" />
        Privacy consent
      </h5>
      <p className="text-muted">
        {privacyGranted
          ? "Privacy consent is already granted for this account."
          : "Grant privacy consent so the clinic can keep your case records."}
      </p>
      {privacyNote ? <Alert color={privacyGranted ? "success" : "danger"}>{privacyNote}</Alert> : null}
      <Button color="success" disabled={privacyBusy || privacyGranted} onClick={grantPrivacy}>
        {privacyBusy ? "Saving..." : privacyGranted ? "Granted" : "Grant privacy"}
      </Button>
    </>
  );
};

export default PatientProfileFields;
