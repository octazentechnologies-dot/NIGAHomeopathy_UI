import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Container, Input, Label } from "reactstrap";
import { getDailySchedule } from "../../helpers/realbackend_helper";
import { readReceptionDoctorId, unwrap } from "./receptionSession";

const ReceptionSchedule = () => {
  const doctorId = readReceptionDoctorId();
  const [date, setDate] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setSchedule(null);
    try {
      const response = await getDailySchedule({ doctorId, scheduleDate: date });
      setSchedule(unwrap(response));
    } catch (err) {
      setError(err?.response?.data || err?.message || "No schedule for this date.");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Schedule</h4>
        <p className="text-muted">Read only. The doctor sets the day.</p>
        <Card><CardBody>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Button className="mt-3" color="primary" onClick={load} disabled={!doctorId || !date}>Show</Button>
          {error ? <Alert className="mt-3" color="warning">{String(error)}</Alert> : null}
          {schedule ? (
            <p className="mt-3 mb-0">
              {schedule.workStartTime || schedule.WorkStartTime} – {schedule.workEndTime || schedule.WorkEndTime}
              {" · "}interval {schedule.slotIntervalMinutes || schedule.SlotIntervalMinutes} min
              {" · "}break {schedule.breakStartTime || schedule.BreakStartTime || "none"} – {schedule.breakEndTime || schedule.BreakEndTime || ""}
            </p>
          ) : null}
          <div className="mt-3"><Link to="/reception">Back</Link></div>
        </CardBody></Card>
      </Container>
    </div>
  );
};

export default ReceptionSchedule;
