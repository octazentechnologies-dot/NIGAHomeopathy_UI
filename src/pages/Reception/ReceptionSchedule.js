import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, CardBody, Container, Input, Label, Spinner, Table } from "reactstrap";
import { getAppointmentSlots, getDailySchedule } from "../../helpers/realbackend_helper";
import { apiMessage, readReceptionDoctorId, unwrap } from "./receptionSession";
import "./ReceptionNew/components/receptionDashboard.css";

/** API expects yyyy-MM-dd. Browser may show dd-mm-yyyy; value must stay ISO. */
const toApiDate = (value) => {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmy = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return raw;
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value != null && value !== "") return value;
  }
  return null;
};

const clock = (value) => {
  if (value == null || value === "") return "—";
  const text = String(value);
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return text;
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
};

const SCHEDULE_ROWS = [
  { label: "Date", keys: ["scheduleDate", "ScheduleDate"], format: (value) => String(value).slice(0, 10) },
  { label: "Work starts", keys: ["workStartTime", "WorkStartTime"], format: clock },
  { label: "Work ends", keys: ["workEndTime", "WorkEndTime"], format: clock },
  { label: "Slot interval", keys: ["slotIntervalMinutes", "SlotIntervalMinutes"], format: (value) => `${value} min` },
  { label: "Break starts", keys: ["breakStartTime", "BreakStartTime"], format: clock },
  { label: "Break ends", keys: ["breakEndTime", "BreakEndTime"], format: clock },
  { label: "Locked", keys: ["isLocked", "IsLocked"], format: (value) => (value ? "Yes" : "No") },
];

/** REC-11.01 — /reception/schedule read-only over GetDailySchedule (no Save / edit). */
const ReceptionSchedule = () => {
  const doctorId = readReceptionDoctorId();
  const [date, setDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [schedule, setSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Schedule | Homeocentrum";
  }, []);

  const load = useCallback(async () => {
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
        setNote("No working day is saved for this date.");
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
      const list = data.slots || data.Slots;
      setSlots(Array.isArray(list) ? list : []);
      setSchedule((current) => {
        const hours = {
          scheduleDate: pick(current, "scheduleDate", "ScheduleDate") || scheduleDate,
          workStartTime: pick(current, "workStartTime", "WorkStartTime") || pick(data, "workStartTime", "WorkStartTime"),
          workEndTime: pick(current, "workEndTime", "WorkEndTime") || pick(data, "workEndTime", "WorkEndTime"),
          slotIntervalMinutes: pick(current, "slotIntervalMinutes", "SlotIntervalMinutes") || pick(data, "intervalMinutes", "IntervalMinutes"),
          breakStartTime: pick(current, "breakStartTime", "BreakStartTime"),
          breakEndTime: pick(current, "breakEndTime", "BreakEndTime"),
          isLocked: pick(current, "isLocked", "IsLocked"),
        };
        return { ...(current || {}), ...hours };
      });
    } catch (err) {
      if (!scheduleFailed) {
        setError(apiMessage(err, "Could not load slots."));
      }
    } finally {
      setLoading(false);
    }
  }, [date, doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page-content admin-dashboard-page reception-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title"><i className="ri-calendar-2-line" aria-hidden="true" />Doctor schedule</h2>
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
                className="btn btn-sm btn-soft-primary"
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

            <h6 className="mb-2">Working day</h6>
            <Table responsive size="sm" className="align-middle mb-3 clinic-data-table" data-testid="reception-schedule-readonly">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_ROWS.map((row) => {
                  const raw = schedule ? pick(schedule, ...row.keys) : null;
                  const shown = raw == null || raw === "" ? "—" : row.format(raw);
                  return (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{shown}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <p className="text-muted small">Reception can read this day. The doctor edits it on the doctor schedule.</p>

            <h6 className="mb-2">Slots</h6>
            <Table responsive size="sm" className="align-middle mb-0 clinic-data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Patient</th>
                </tr>
              </thead>
              <tbody>
                {slots.length ? slots.map((row) => {
                  const time = pick(row, "time", "Time");
                  const label = pick(row, "label", "Label") || time;
                  const statusRaw = pick(row, "status", "Status", "availability", "Availability");
                  const status = statusRaw
                    ? String(statusRaw).charAt(0).toUpperCase() + String(statusRaw).slice(1).toLowerCase()
                    : "—";
                  const patient = pick(row, "patientName", "PatientName") || "—";
                  return (
                    <tr key={`${time}-${label}`}>
                      <td>{clock(time)}</td>
                      <td>{label || "—"}</td>
                      <td>{status}</td>
                      <td>{patient}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      {loading ? "Loading slots…" : "No slots for this date."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ReceptionSchedule;
