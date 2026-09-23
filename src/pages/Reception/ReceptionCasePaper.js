import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Container, Input, Label } from "reactstrap";
import { saveReceptionCasePaper } from "../../helpers/realbackend_helper";

const ReceptionCasePaper = () => {
  const [patientId, setPatientId] = useState("");
  const [patientAppId, setPatientAppId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    setMessage("");
    try {
      await saveReceptionCasePaper({
        patientId: Number(patientId),
        patientAppId: patientAppId ? Number(patientAppId) : null,
        chiefComplaint,
      });
      setMessage("Case paper saved for the doctor to read. Repertory was not opened.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not save the case paper.");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Case paper</h4>
        <Card><CardBody>
          {error ? <Alert color="danger">{error}</Alert> : null}
          {message ? <Alert color="success">{message}</Alert> : null}
          <Label>Patient id</Label>
          <Input value={patientId} onChange={(event) => setPatientId(event.target.value)} />
          <Label className="mt-2">Appointment id (optional)</Label>
          <Input value={patientAppId} onChange={(event) => setPatientAppId(event.target.value)} />
          <Label className="mt-2">Chief complaint</Label>
          <Input type="textarea" value={chiefComplaint} onChange={(event) => setChiefComplaint(event.target.value)} />
          <Button className="mt-3" color="primary" onClick={save}>Save</Button>
          <div className="mt-3"><Link to="/reception">Back</Link></div>
        </CardBody></Card>
      </Container>
    </div>
  );
};

export default ReceptionCasePaper;
