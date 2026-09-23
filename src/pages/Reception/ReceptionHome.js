import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row } from "reactstrap";
import { assistedBook, callNextAppointment, getAppointmentQueue } from "../../helpers/realbackend_helper";
import { readReceptionDoctorId, unwrap } from "./receptionSession";

const ReceptionHome = () => {
  const doctorId = readReceptionDoctorId();
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [book, setBook] = useState({ patientId: "", appointmentDate: "", appointmentTime: "", consultMode: "InClinic" });
  const [note, setNote] = useState("");

  const load = async () => {
    if (!doctorId) return;
    const response = await getAppointmentQueue(doctorId);
    const body = unwrap(response);
    const rows = body.queue || body.Queue || body.data || body;
    setQueue(Array.isArray(rows) ? rows : []);
  };

  useEffect(() => {
    load().catch((err) => setError(err?.response?.data?.message || err?.message || "Queue failed"));
  }, [doctorId]);

  const callNext = async () => {
    try {
      const response = await callNextAppointment(doctorId);
      setNote(unwrap(response).message || "Next patient called.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No waiting patient");
    }
  };

  const saveAssisted = async () => {
    setError("");
    try {
      await assistedBook({
        doctorId,
        patientId: Number(book.patientId),
        appointmentDate: book.appointmentDate,
        appointmentTime: book.appointmentTime.length === 5 ? `${book.appointmentTime}:00` : book.appointmentTime,
        consultMode: book.consultMode,
      });
      setNote("Assisted booking saved. The patient was not charged here.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Assisted booking failed");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Reception</h4>
        <p className="text-muted">Clinical case-taking stays on the doctor. These actions are for this doctor only.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col md={6}>
            <Card><CardBody>
              <h5>Quick actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-primary" to="/doctordashboard">New patient / appointment</Link>
                <Link className="btn btn-soft-secondary" to="/reception/schedule">Schedule</Link>
                <Link className="btn btn-soft-secondary" to="/reception/case-paper">Case paper</Link>
                <Link className="btn btn-soft-secondary" to="/profile">Profile</Link>
                <Button color="soft-warning" onClick={() => setReceipt({ amount: "", method: "Pay at clinic", gst: "Phase 6" })}>Collect payment</Button>
              </div>
            </CardBody></Card>
          </Col>
          <Col md={6}>
            <Card><CardBody>
              <div className="d-flex justify-content-between">
                <h5>Queue</h5>
                <Button size="sm" color="primary" onClick={callNext} disabled={!doctorId}>Call next</Button>
              </div>
              {queue.length === 0 ? <p className="text-muted mb-0">No waiting visits.</p> : (
                <ul className="mb-0">
                  {queue.map((row) => (
                    <li key={row.patientAppId || row.PatientAppId}>
                      {row.patientName || row.PatientName || "Patient"} · {row.appointmentTime || row.AppointmentTime} · {row.paymentStatus || row.PaymentStatus || "UNPAID"}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody></Card>
          </Col>
          {receipt ? (
            <Col md={6}>
              <Card><CardBody>
                <h5>Receipt preview</h5>
                <Label>Amount</Label>
                <Input value={receipt.amount} onChange={(event) => setReceipt({ ...receipt, amount: event.target.value })} />
                <Label className="mt-2">Method</Label>
                <Input value={receipt.method} disabled />
                <Label className="mt-2">Appointment</Label>
                <Input value={queue[0] ? String(queue[0].patientAppId || queue[0].PatientAppId) : ""} disabled />
                <Label className="mt-2">GST</Label>
                <Input value={receipt.gst} disabled />
                <p className="text-muted small mt-2">This screen does not set PaymentStatus to PAID.</p>
              </CardBody></Card>
            </Col>
          ) : null}
          <Col md={6}>
            <Card><CardBody>
              <h5>Assisted booking</h5>
              <Label>Patient id</Label>
              <Input value={book.patientId} onChange={(event) => setBook({ ...book, patientId: event.target.value })} />
              <Label className="mt-2">Date</Label>
              <Input type="date" value={book.appointmentDate} onChange={(event) => setBook({ ...book, appointmentDate: event.target.value })} />
              <Label className="mt-2">Time</Label>
              <Input type="time" value={book.appointmentTime} onChange={(event) => setBook({ ...book, appointmentTime: event.target.value })} />
              <Label className="mt-2">Consult</Label>
              <Input type="select" value={book.consultMode} onChange={(event) => setBook({ ...book, consultMode: event.target.value })}>
                <option value="InClinic">In-clinic</option>
                <option value="Tele">Tele</option>
              </Input>
              <Button className="mt-3" color="primary" onClick={saveAssisted} disabled={!doctorId}>Book for patient</Button>
            </CardBody></Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ReceptionHome;
