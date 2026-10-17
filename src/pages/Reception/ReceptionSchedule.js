import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, CardBody, Container, Input, Label, Spinner, Table } from "reactstrap";
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
    <div className="page-content admin-dashboard-page reception-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Doctor schedule</h2>
            <p className="clinic-page-subtitle mb-0">
              Read-only view of the doctor&apos;s working day. Edit is only on the doctor schedule screen.
            </p>
          </div>
          <Link to="/reception" className="btn btn-sm btn-soft-secondary clinic-action-btn">
            <i className="ri-arrow-left-line" aria-hidden="true" />
            Reception home
          </Link>
        </div>

        <Card className="admin-dash-card">
          <CardBody>
            <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
              <div style={{ minWidth: 200 }}>
                <Label className="form-label">Date</Label>
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <button
                type="button"
                className="btn btn-sm clinic-primary-btn"
                onClick={load}
                disabled={!doctorId || !date || loading}
              >
                {loading ? <Spinner size="sm" className="me-1" /> : <i className="ri-search-line" aria-hidden="true" />}
                {loading ? "Loading…" : "Show"}
              </button>
            </div>

            {!doctorId ? (
              <Alert color="warning" className="py-2 small">
                Doctor context is missing for this reception login.
              </Alert>
            ) : null}
            {error ? (
              <Alert color="warning" className="py-2 small">
                {String(error)}
              </Alert>
            ) : null}
            {note ? (
              <Alert color="info" className="py-2 small">
                {note}
              </Alert>
            ) : null}

            {schedule ? (
              <div className="mb-3" data-testid="reception-schedule-readonly">
                <p className="mb-1">
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
              <Table responsive size="sm" className="align-middle mb-0 clinic-data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Label</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((row) => {
                    const time = row.time || row.Time;
                    const label = row.label || row.Label || time;
                    const status = row.status || row.Status || row.availability || row.Availability || "—";
                    return (
                      <tr key={`${time}-${label}`}>
                        <td>{time}</td>
                        <td>{label}</td>
                        <td>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            ) : null}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ReceptionSchedule;
