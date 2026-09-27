import React, { useState } from "react";
import { Alert, Button, FormGroup, Input, Label, Spinner } from "reactstrap";
import { createPatient } from "../../../helpers/realbackend_helper";
import { buildPatientApiPayload } from "../../../helpers/patient_payload_helper";
import { getAuthDoctorId } from "../../../helpers/appointmentSlotHelper";
import { getAuthUserId } from "../../../helpers/menuByRole";
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from "../../../Components/Common/DateOfBirthPicker";
import { apiMessage } from "../receptionSession";

const EMPTY = {
  patientName: "",
  mobileNo: "",
  gender: "0",
  dateOfBirth: "",
};

/** Front-desk register — same POST /patient as doctor New Patient, clinic doctor from JWT. */
const ReceptionNewPatientForm = ({ onCreated }) => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const save = async () => {
    setError("");
    setNote("");
    const name = String(form.patientName || "").trim();
    const mobile = String(form.mobileNo || "").replace(/\D/g, "");
    if (!name) {
      setError("Patient name is required.");
      return;
    }
    if (mobile.length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPatientApiPayload({
        isCreate: true,
        patient: { doctorID: Number(getAuthDoctorId() || 0) },
        form: {
          patientName: name,
          mobileNo: mobile,
          gender: Number(form.gender),
          dateOfBirth: form.dateOfBirth,
        },
      });
      const doctorUserId = Number(getAuthUserId() || 0);
      if (doctorUserId) payload.loggedInUser = doctorUserId;
      const response = await createPatient(payload);
      const body = response?.data ?? response ?? {};
      const created = body.data || body.Data || body;
      const patientId =
        created.patientID ?? created.patientId ?? created.PatientID ?? created.PatientId;
      setNote(`${name} saved. You can book a slot or log a case paper now.`);
      setForm(EMPTY);
      onCreated?.({
        patientId,
        patientName: name,
        mobileNo: mobile,
      });
    } catch (err) {
      setError(apiMessage(err, "Could not register the patient."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="reception-new-patient">
      {error ? <Alert color="danger">{error}</Alert> : null}
      {note ? <Alert color="success">{note}</Alert> : null}
      <FormGroup>
        <Label htmlFor="rec-new-name">Full name</Label>
        <Input
          id="rec-new-name"
          value={form.patientName}
          onChange={(e) => setForm({ ...form, patientName: e.target.value })}
          placeholder="Patient full name"
          autoComplete="off"
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="rec-new-mobile">Mobile</Label>
        <Input
          id="rec-new-mobile"
          value={form.mobileNo}
          onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
          placeholder="10-digit mobile"
          inputMode="numeric"
        />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="rec-new-gender">Gender</Label>
        <Input
          id="rec-new-gender"
          type="select"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        >
          <option value="0">Male</option>
          <option value="1">Female</option>
        </Input>
      </FormGroup>
      <FormGroup>
        <Label>Date of birth</Label>
        <DateOfBirthPicker
          name="recNewDob"
          value={form.dateOfBirth}
          maxDate="today"
          minDate={null}
          placeholder={DOB_DISPLAY_FORMAT}
          onChange={(dateOfBirth) => setForm({ ...form, dateOfBirth })}
        />
      </FormGroup>
      <Button className="reception-primary-btn" type="button" disabled={saving} onClick={save}>
        {saving ? <Spinner size="sm" /> : "Save patient"}
      </Button>
    </div>
  );
};

export default ReceptionNewPatientForm;
