import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Container, Input, Label } from "reactstrap";
import { getAppointmentSlots, getDailySchedule } from "../../helpers/realbackend_helper";
import { apiMessage, readReceptionDoctorId, unwrap } from "./receptionSession";

/** API expects yyyy-MM-dd. Browser may show dd-mm-yyyy; value must stay ISO. */
const toApiDate = (value) => {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmy = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return raw;
};

/** REC-11.01 — /reception/schedule read-only over GetDailySchedule (no Save / edit). */
const ReceptionSchedule = () => {
  const doctorId = readReceptionDoctorId();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Schedule | Homeocentrum";
  }, []);

  const load = async () => {
    setError("");
    setNote("");
    setSchedule(null);
    setSlots([]);
    const scheduleDate = toApiDate(date);
    if (!doctorId || !scheduleDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
      setError("Use a valid date (yyyy-mm-dd).");
      return;
    }
    setLoading(true);
    let scheduleFailed = false;
    try {
      const response = await getDailySchedule({
        DoctorId: doctorId,
        ScheduleDate: scheduleDate,
      });
      if (!response) {
        setNote("No daily schedule is configured for this date.");
      } else {
        const body = unwrap(response);
        setSchedule(body.data || body.Data || body);
      }
    } catch (err) {
      scheduleFailed = true;
      setError(apiMessage(err, "No schedule for this date."));
    }
    try {
      const slotRes = await getAppointmentSlots({
        DoctorId: doctorId,
        AppointmentDate: scheduleDate,
      });
      const body = unwrap(slotRes);
      const data = body.data || body.Data || body;
      setSlots(Array.isArray(data.slots || data.Slots) ? (data.slots || data.Slots) : []);
    } catch (err) {
      if (!scheduleFailed) {
        setError(apiMessage(err, "Could not load slots."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Doctor schedule</h4>
        <p className="text-muted mb-3">
          Read-only view of the doctor&apos;s working day. Edit is only on the doctor schedule screen.
        </p>
        <Card>
          <CardBody>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <Button
              className="mt-3"
              color="primary"
              onClick={load}
              disabled={!doctorId || !date || loading}
            >
              {loading ? "Loading…" : "Show"}
            </Button>
            {!doctorId ? (
              <Alert className="mt-3" color="warning">Doctor context is missing for this reception login.</Alert>
            ) : null}
            {error ? <Alert className="mt-3" color="warning">{String(error)}</Alert> : null}
            {note ? <Alert className="mt-3" color="info">{note}</Alert> : null}
            {schedule ? (
              <div className="mt-3" data-testid="reception-schedule-readonly">
                <p className="mb-2">
                  <strong>Hours:</strong> {schedule.workStartTime || schedule.WorkStartTime} –{" "}
                  {schedule.workEndTime || schedule.WorkEndTime}
                  {" · "}
                  <strong>Interval:</strong> {schedule.slotIntervalMinutes || schedule.SlotIntervalMinutes} min
                  {" · "}
                  <strong>Break:</strong>{" "}
                  {schedule.breakStartTime || schedule.BreakStartTime || "none"}
                  {(schedule.breakEndTime || schedule.BreakEndTime)
                    ? ` – ${schedule.breakEndTime || schedule.BreakEndTime}`
                    : ""}
                </p>
                <p className="text-muted small mb-0">No Save or edit controls on this page.</p>
              </div>
            ) : null}
            {slots.length ? (
              <ul className="mt-3 mb-0">
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
            <div className="mt-3">
              <Link to="/reception">Back</Link>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ReceptionSchedule;
