import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Container, Input, Label } from "reactstrap";
import { getAppointmentSlots, getDailySchedule } from "../../helpers/realbackend_helper";
import { apiMessage, readReceptionDoctorId, unwrap } from "./receptionSession";

const ReceptionSchedule = () => {
  const doctorId = readReceptionDoctorId();
  const [date, setDate] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");

  React.useEffect(() => {
    document.title = "Schedule | Homeocentrum";
  }, []);

  const load = async () => {
    setError("");
    setSchedule(null);
    setSlots([]);
    try {
      const response = await getDailySchedule({ doctorId, scheduleDate: date });
      setSchedule(unwrap(response));
    } catch (err) {
      setError(apiMessage(err, "No schedule for this date."));
    }
    try {
      const slotRes = await getAppointmentSlots({ DoctorId: doctorId, AppointmentDate: date });
      const body = unwrap(slotRes);
      const data = body.data || body.Data || body;
      setSlots(Array.isArray(data.slots || data.Slots) ? (data.slots || data.Slots) : []);
    } catch (err) {
      if (!error) {
        setError(apiMessage(err, "Could not load slots."));
      }
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
            <p className="mt-3 mb-2">
              {schedule.workStartTime || schedule.WorkStartTime} – {schedule.workEndTime || schedule.WorkEndTime}
              {" · "}interval {schedule.slotIntervalMinutes || schedule.SlotIntervalMinutes} min
              {" · "}break {schedule.breakStartTime || schedule.BreakStartTime || "none"} – {schedule.breakEndTime || schedule.BreakEndTime || ""}
            </p>
          ) : null}
          {slots.length ? (
            <ul className="mt-2 mb-0">
              {slots.map((row) => {
                const time = row.time || row.Time;
                const label = row.label || row.Label || time;
                const status = row.status || row.Status;
                const name = row.patientName || row.PatientName;
                return (
                  <li key={time}>
                    {label} · {status}
                    {name ? ` · ${name}` : ""}
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-3"><Link to="/reception">Back</Link></div>
        </CardBody></Card>
      </Container>
    </div>
  );
};

export default ReceptionSchedule;
