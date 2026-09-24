import React, { useEffect, useState } from "react";
import { Alert, Button, Col, FormFeedback, Input, Label, Row } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getReceptionProfile, updateReceptionProfile } from "../../helpers/realbackend_helper";
import { apiMessage, unwrap } from "./receptionSession";

const emptyForm = { firstName: "", lastName: "", mobileNo: "", emailId: "" };

const splitName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const readProfile = (response) => {
  const body = unwrap(response);
  const profile = body.data || body.Data || body;
  const names = splitName(profile.fullName || profile.FullName);
  return {
    firstName: profile.firstName || profile.FirstName || names.firstName,
    lastName: profile.lastName || profile.LastName || names.lastName,
    mobileNo: profile.mobileNo || profile.MobileNo || profile.contactNumber || profile.ContactNumber || "",
    emailId: profile.emailId || profile.EmailId || "",
  };
};

const validate = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.mobileNo.trim()) errors.mobileNo = "Mobile is required.";
  else if (!/^[0-9+\-\s]{8,15}$/.test(form.mobileNo.trim())) errors.mobileNo = "Enter a valid mobile number.";
  if (form.emailId.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId.trim())) {
    errors.emailId = "Enter a valid email.";
  }
  return errors;
};

const ReceptionProfileFields = () => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getReceptionProfile()
      .then((response) => setForm(readProfile(response)))
      .catch((err) => setLoadError(apiMessage(err, "Profile could not be loaded.")));
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const save = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSaveError("");
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const response = await updateReceptionProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobileNo: form.mobileNo.trim(),
        emailId: form.emailId.trim(),
      });
      setForm(readProfile(response));
      toast.success("Profile saved.", { autoClose: 3000 });
    } catch (err) {
      setSaveError(apiMessage(err, "Could not save the profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastContainer closeButton={false} limit={1} />
      {loadError ? <Alert color="danger">{loadError}</Alert> : null}
      {saveError ? <Alert color="danger">{saveError}</Alert> : null}
      <Row className="g-3">
        <Col md={6}>
          <Label>First name</Label>
          <Input invalid={!!errors.firstName} value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} />
          {errors.firstName ? <FormFeedback>{errors.firstName}</FormFeedback> : null}
        </Col>
        <Col md={6}>
          <Label>Last name</Label>
          <Input value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} />
        </Col>
        <Col md={6}>
          <Label>Mobile</Label>
          <Input invalid={!!errors.mobileNo} value={form.mobileNo} onChange={(event) => setField("mobileNo", event.target.value)} />
          {errors.mobileNo ? <FormFeedback>{errors.mobileNo}</FormFeedback> : null}
        </Col>
        <Col md={6}>
          <Label>Email</Label>
          <Input invalid={!!errors.emailId} value={form.emailId} onChange={(event) => setField("emailId", event.target.value)} />
          {errors.emailId ? <FormFeedback>{errors.emailId}</FormFeedback> : null}
        </Col>
      </Row>
      <Button className="mt-3" color="primary" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </>
  );
};

export default ReceptionProfileFields;
