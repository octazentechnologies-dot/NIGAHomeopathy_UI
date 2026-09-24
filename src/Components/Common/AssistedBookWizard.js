import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Label, ListGroup, ListGroupItem, Spinner } from "reactstrap";
import {
  assistedBook,
  getAppointmentSlots,
  getPatientList,
  listBookingAssistanceRequests,
} from "../../helpers/realbackend_helper";
import { getAuthUserId } from "../../helpers/menuByRole";

const unwrap = (response) => response?.data ?? response?.Data ?? response ?? {};

const apiMessage = (err, fallback) => {
  const data = err?.response?.data;
  return data?.message || data?.Message || (typeof err === "string" ? err : fallback);
};

const patientIdOf = (row) =>
  row?.patientID ?? row?.patientId ?? row?.PatientID ?? row?.PatientId ?? null;
const nameOf = (row) => row?.patientName ?? row?.PatientName ?? "Patient";
const mobileOf = (row) => row?.mobileNo ?? row?.MobileNo ?? row?.phoneNo ?? row?.PhoneNo ?? "";

/** Parse PatientId=123 from AssistedRequest ticket body. */
export const patientIdFromAssistanceBody = (body) => {
  const text = String(body || "");
  const match = text.match(/PatientId\s*=\s*(\d+)/i);
  return match ? match[1] : "";
};

/** Parse ContactMobile=… from AssistedRequest ticket body. */
export const mobileFromAssistanceBody = (body) => {
  const text = String(body || "");
  const match = text.match(/ContactMobile\s*=\s*([0-9+\-\s]{8,15})/i);
  return match ? match[1].replace(/\s+/g, "") : "";
};

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

/**
 * SUP-07.03 — admin/reception assisted-book wizard (BookingChannel=Assisted).
 * Reception: doctorId fixed from clinic context. Admin: can type doctorId.
 * Patient lookup: id, name, or mobile (API still books by PatientId).
 */
const AssistedBookWizard = ({
  doctorId: fixedDoctorId,
  allowDoctorPick = false,
  showRequestQueue = true,
}) => {
  const [doctorId, setDoctorId] = useState(fixedDoctorId ? String(fixedDoctorId) : "");
  const [book, setBook] = useState({
    patientId: "",
    appointmentDate: "",
    appointmentTime: "",
    consultMode: "InClinic",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsNote, setSlotsNote] = useState("");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (fixedDoctorId) setDoctorId(String(fixedDoctorId));
  }, [fixedDoctorId]);

  const loadPatients = async () => {
    const userId = getAuthUserId();
    if (!userId) {
      setPatientsError("Clinic patient list needs a doctor context. You can still type Patient id.");
      setPatients([]);
      return;
    }
    setPatientsLoading(true);
    setPatientsError("");
    try {
      const response = await getPatientList({ userId });
      const rows = unwrap(response);
      const list = Array.isArray(rows) ? rows : rows?.data || rows?.Data || [];
      const byPatient = new Map();
      (Array.isArray(list) ? list : []).forEach((row) => {
        const id = Number(patientIdOf(row));
        if (!id) return;
        if (!byPatient.has(id)) byPatient.set(id, row);
      });
      setPatients(Array.from(byPatient.values()));
    } catch (err) {
      setPatients([]);
      setPatientsError(apiMessage(err, "Could not load clinic patients."));
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const loadRequests = async () => {
    if (!showRequestQueue) return;
    try {
      const response = await listBookingAssistanceRequests();
      const body = unwrap(response);
      const nested = body.data || body.Data;
      const rows = Array.isArray(body)
        ? body
        : Array.isArray(nested)
          ? nested
          : [];
      const open = rows.filter((row) => {
        const status = String(row.status || row.Status || "").toUpperCase();
        return status === "OPEN" || status === "IN_PROGRESS";
      });
      setRequests(open);
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [showRequestQueue]);

  useEffect(() => {
    const loadSlots = async () => {
      const did = Number(doctorId);
      if (!did || !book.appointmentDate) {
        setSlots([]);
        setSlotsNote("");
        return;
      }
      try {
        const response = await getAppointmentSlots({
          DoctorId: did,
          AppointmentDate: book.appointmentDate,
        });
        const body = unwrap(response);
        const data = body.data || body.Data || body;
        const list = data.slots || data.Slots || [];
        const available = (Array.isArray(list) ? list : []).filter(
          (row) => String(row.status || row.Status || "").toLowerCase() === "available"
        );
        setSlots(available);
        setSlotsNote(available.length ? "" : "No open slots on this date.");
        setBook((prev) => ({ ...prev, appointmentTime: "" }));
      } catch (err) {
        setSlots([]);
        setSlotsNote(apiMessage(err, "Could not load slots."));
      }
    };
    loadSlots();
  }, [doctorId, book.appointmentDate]);

  useEffect(() => {
    if (!book.patientId || !patients.length) return;
    const match = patients.find((row) => String(patientIdOf(row)) === String(book.patientId));
    if (!match) return;
    setSelectedLabel(`${nameOf(match)} · ${mobileOf(match) || "no mobile"} · ID ${patientIdOf(match)}`);
  }, [patients, book.patientId]);

  const filteredPatients = useMemo(() => {
    const q = String(patientSearch || "").trim().toLowerCase();
    const qDigits = digitsOnly(q);
    if (!q) return patients.slice(0, 8);
    return patients
      .filter((row) => {
        const id = String(patientIdOf(row) || "");
        const name = String(nameOf(row) || "").toLowerCase();
        const mobile = String(mobileOf(row) || "").toLowerCase();
        const mobileDigits = digitsOnly(mobile);
        return (
          name.includes(q) ||
          mobile.includes(q) ||
          id.includes(q) ||
          (qDigits.length >= 3 && mobileDigits.includes(qDigits))
        );
      })
      .slice(0, 20);
  }, [patients, patientSearch]);

  const selectPatient = (row) => {
    const id = patientIdOf(row);
    setBook((prev) => ({ ...prev, patientId: id ? String(id) : "" }));
    setSelectedLabel(`${nameOf(row)} · ${mobileOf(row) || "no mobile"} · ID ${id}`);
    setPatientSearch("");
    setError("");
  };

  const resolvePatientIdFromList = (preferredId, mobileHint) => {
    if (preferredId) return String(preferredId);
    const mobileDigits = digitsOnly(mobileHint);
    if (!mobileDigits || !patients.length) return "";
    const match = patients.find((row) => {
      const rowDigits = digitsOnly(mobileOf(row));
      return rowDigits && (rowDigits === mobileDigits || rowDigits.endsWith(mobileDigits) || mobileDigits.endsWith(rowDigits));
    });
    return match ? String(patientIdOf(match)) : "";
  };

  const applyRequest = (row) => {
    const body = row.body || row.Body || "";
    const fromBody = patientIdFromAssistanceBody(body);
    const mobileHint = mobileFromAssistanceBody(body);
    const resolved = resolvePatientIdFromList(fromBody, mobileHint);
    setBook((prev) => ({
      ...prev,
      patientId: resolved || fromBody || prev.patientId,
    }));
    if (mobileHint && !resolved && !fromBody) {
      setPatientSearch(mobileHint);
      setNote(
        `Working request #${row.supportTicketId || row.SupportTicketId}. No PatientId in ticket — search by mobile ${mobileHint} below.`
      );
    } else {
      setNote(`Working request #${row.supportTicketId || row.SupportTicketId}. Complete the booking below.`);
    }
  };

  const saveAssisted = async () => {
    setError("");
    setNote("");
    const did = Number(doctorId);
    const pid = Number(book.patientId);
    if (!did || !pid) {
      setError("Doctor id and a selected patient (id / name / mobile) are required.");
      return;
    }
    if (!book.appointmentDate || !book.appointmentTime) {
      setError("Pick a date and an open slot.");
      return;
    }
    setSaving(true);
    try {
      await assistedBook({
        doctorId: did,
        patientId: pid,
        appointmentDate: book.appointmentDate,
        appointmentTime:
          book.appointmentTime.length === 5 ? `${book.appointmentTime}:00` : book.appointmentTime,
        consultMode: book.consultMode,
      });
      setNote("Assisted booking saved. Payment stays with Homeocentrum (not charged here).");
      setBook({ patientId: "", appointmentDate: "", appointmentTime: "", consultMode: "InClinic" });
      setSelectedLabel("");
      setPatientSearch("");
      await loadRequests();
    } catch (err) {
      setError(apiMessage(err, "Assisted booking failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="assisted-book-wizard">
      {error ? <Alert color="danger">{error}</Alert> : null}
      {note ? <Alert color="success">{note}</Alert> : null}

      {showRequestQueue ? (
        <div className="mb-3" data-testid="assisted-request-queue">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Open assistance requests</h6>
            <Button size="sm" color="light" type="button" onClick={loadRequests}>
              Refresh
            </Button>
          </div>
          {requests.length === 0 ? (
            <p className="text-muted small mb-0">No open AssistedRequest tickets.</p>
          ) : (
            <ListGroup flush>
              {requests.map((row) => {
                const id = row.supportTicketId || row.SupportTicketId;
                const subject = row.subject || row.Subject || "Assisted booking request";
                return (
                  <ListGroupItem
                    key={id}
                    action
                    tag="button"
                    type="button"
                    className="px-0"
                    onClick={() => applyRequest(row)}
                    data-testid={`assisted-request-${id}`}
                  >
                    <strong>#{id}</strong> · {subject}
                    <div className="text-muted small text-truncate">
                      {row.body || row.Body || ""}
                    </div>
                  </ListGroupItem>
                );
              })}
            </ListGroup>
          )}
        </div>
      ) : null}

      {allowDoctorPick ? (
        <>
          <Label htmlFor="assisted-doctor-id">Doctor id</Label>
          <Input
            id="assisted-doctor-id"
            type="number"
            min={1}
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            data-testid="assisted-doctor-id"
          />
        </>
      ) : null}

      <Label className={allowDoctorPick ? "mt-2" : undefined} htmlFor="assisted-patient-search">
        Find patient
      </Label>
      <Input
        id="assisted-patient-search"
        value={patientSearch}
        onChange={(e) => setPatientSearch(e.target.value)}
        placeholder="Type name, mobile, or id"
        autoComplete="off"
        data-testid="assisted-patient-search"
      />
      <div className="d-flex justify-content-between align-items-center mt-1 mb-1">
        <small className="text-muted">
          {patientsLoading
            ? "Loading clinic patients…"
            : `${patients.length} patients — pick one, or type Patient id below`}
        </small>
        <Button color="link" size="sm" className="p-0" type="button" onClick={loadPatients} disabled={patientsLoading}>
          Refresh
        </Button>
      </div>
      {patientsError ? <p className="text-warning small mb-1">{patientsError}</p> : null}
      {patientsLoading ? <Spinner size="sm" className="mb-2" /> : null}
      {!patientsLoading && filteredPatients.length > 0 ? (
        <ListGroup className="mb-2" flush style={{ maxHeight: 200, overflowY: "auto" }} data-testid="assisted-patient-matches">
          {filteredPatients.map((row) => {
            const id = patientIdOf(row);
            const active = String(id) === String(book.patientId);
            return (
              <ListGroupItem
                key={id}
                action
                active={active}
                tag="button"
                type="button"
                className="py-2"
                onClick={() => selectPatient(row)}
                data-testid={`assisted-patient-${id}`}
              >
                <div className="fw-medium text-truncate">{nameOf(row)}</div>
                <small className={active ? "" : "text-muted"}>
                  {mobileOf(row) || "No mobile"} · ID {id}
                </small>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      ) : null}
      {!patientsLoading && patientSearch && filteredPatients.length === 0 ? (
        <p className="text-muted small">No match. Try another name/mobile, or register the patient first.</p>
      ) : null}

      {selectedLabel ? (
        <Alert color="info" className="py-2">
          Selected: <strong>{selectedLabel}</strong>
        </Alert>
      ) : null}

      <Label htmlFor="assisted-patient-id">Patient id</Label>
      <Input
        id="assisted-patient-id"
        type="number"
        min={1}
        inputMode="numeric"
        placeholder="Numeric PatientId (or pick from search above)"
        value={book.patientId}
        onChange={(e) => {
          setBook({ ...book, patientId: e.target.value });
          setSelectedLabel("");
        }}
        data-testid="assisted-patient-id"
      />
      <p className="text-muted small mb-0 mt-1">
        Booking API needs Patient id. Search by name or mobile fills it for you. Open a request above to auto-fill when the ticket has PatientId or ContactMobile.
      </p>

      <Label className="mt-2" htmlFor="assisted-date">
        Date
      </Label>
      <Input
        id="assisted-date"
        type="date"
        value={book.appointmentDate}
        onChange={(e) => setBook({ ...book, appointmentDate: e.target.value })}
        data-testid="assisted-date"
      />

      <Label className="mt-2">Time</Label>
      <Input
        type="select"
        value={book.appointmentTime}
        onChange={(e) => setBook({ ...book, appointmentTime: e.target.value })}
        disabled={!book.appointmentDate || !doctorId}
        data-testid="assisted-time"
      >
        <option value="">
          {book.appointmentDate ? "Select an open slot" : "Choose a date first"}
        </option>
        {slots.map((row) => {
          const time = row.time || row.Time;
          const label = row.label || row.Label || time;
          return (
            <option key={time} value={time}>
              {label}
            </option>
          );
        })}
      </Input>
      {slotsNote ? <p className="text-muted small mb-0 mt-1">{slotsNote}</p> : null}

      <Label className="mt-2">Consult</Label>
      <Input
        type="select"
        value={book.consultMode}
        onChange={(e) => setBook({ ...book, consultMode: e.target.value })}
        data-testid="assisted-consult"
      >
        <option value="InClinic">In-clinic</option>
        <option value="Tele">Tele</option>
      </Input>

      <Button
        className="mt-3"
        color="primary"
        onClick={saveAssisted}
        disabled={saving || !doctorId}
        data-testid="assisted-book-submit"
      >
        {saving ? "Booking…" : "Book for patient"}
      </Button>
    </div>
  );
};

export default AssistedBookWizard;
