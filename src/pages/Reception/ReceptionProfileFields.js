import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Input, Label, Row } from "reactstrap";
import { getReceptionProfile, updateReceptionProfile } from "../../helpers/realbackend_helper";
import { unwrap } from "./receptionSession";

const ReceptionProfileFields = () => {
  const [form, setForm] = useState({ firstName: "", lastName: "", mobileNo: "", emailId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getReceptionProfile()
      .then((response) => {
        const body = unwrap(response);
        setForm({
          firstName: body.firstName || body.FirstName || "",
          lastName: body.lastName || body.LastName || "",
          mobileNo: body.mobileNo || body.MobileNo || "",
          emailId: body.emailId || body.EmailId || "",
        });
      })
      .catch((err) => setError(err?.response?.data?.message || err?.message || "Profile could not be loaded."));
  }, []);

  const save = async () => {
    setError("");
    try {
      await updateReceptionProfile(form);
      setMessage("Profile saved. Clinic fee and bank stay with the doctor.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not save the profile.");
    }
  };

  return (
    <>
      {error ? <Alert color="danger">{error}</Alert> : null}
      {message ? <Alert color="success">{message}</Alert> : null}
      <Row className="g-3">
        <Col md={6}><Label>First name</Label><Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Col>
        <Col md={6}><Label>Last name</Label><Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Col>
        <Col md={6}><Label>Mobile</Label><Input value={form.mobileNo} onChange={(event) => setForm({ ...form, mobileNo: event.target.value })} /></Col>
        <Col md={6}><Label>Email</Label><Input value={form.emailId} onChange={(event) => setForm({ ...form, emailId: event.target.value })} /></Col>
      </Row>
      <Button className="mt-3" color="primary" onClick={save}>Save</Button>
    </>
  );
};

export default ReceptionProfileFields;
