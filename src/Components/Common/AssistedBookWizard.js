import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Label, ListGroup, ListGroupItem, Spinner } from "reactstrap";
import {
  assistedBook,
  getAppointmentSlots,
  getPatientList,
  listBookingAssistanceRequests,
} from "../../helpers/realbackend_helper";
import { getAuthUserId } from "../../helpers/menuByRole";
import { listPublicDoctors, mapPublicDoctorCard } from "../../helpers/publicBookingApi";

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
 * Reception: doctorId fixed from clinic context. Admin: search/select doctor by name.
 * Patient lookup: name or mobile (API still books by PatientId under the hood).
 * selectedPatientId / patientPickKey: fill from queue row click (ReceptionHome).
 */
const AssistedBookWizard = ({
  doctorId: fixedDoctorId,
  allowDoctorPick = false,
  showRequestQueue = true,
  selectedPatientId = "",
  patientPickKey = 0,
  patientNameHint = "",
}) => {
  const [doctorId, setDoctorId] = useState(fixedDoctorId ? String(fixedDoctorId) : "");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const [selectedDoctorLabel, setSelectedDoctorLabel] = useState("");
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

  /** Queue / deep-link: pick patient without typing numeric id. */
  useEffect(() => {
    if (!selectedPatientId) return;
    const id = String(selectedPatientId);
    setBook((prev) => ({ ...prev, patientId: id }));
    if (patientNameHint) {
      setSelectedLabel(patientNameHint);
    }
    setPatientSearch("");
    setNote(
      patientNameHint
        ? `Patient from queue: ${patientNameHint}. Pick date and slot.`
        : "Patient selected from queue. Pick date and slot."
    );
    setError("");
  }, [selectedPatientId, patientPickKey, patientNameHint]);

  const loadPatients = async () => {
    const userId = getAuthUserId();
    if (!userId) {
      setPatientsError("Clinic patient list needs a doctor context. Open a queue row or sign in again.");
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

  const loadDoctors = async (q = "") => {
    if (!allowDoctorPick) return;
    setDoctorsLoading(true);
    setDoctorsError("");
    try {
      const result = await listPublicDoctors({
        q: String(q || "").trim() || undefined,
        pageNumber: 1,
        pageSize: 30,
      });
      const mapped = (result.data || []).map((row) => mapPublicDoctorCard(row));
      setDoctors(mapped);
    } catch (err) {
      setDoctors([]);
      setDoctorsError(apiMessage(err, "Could not load doctors."));
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (!allowDoctorPick) return undefined;
    const handle = setTimeout(() => loadDoctors(doctorSearch), 300);
    return () => clearTimeout(handle);
  }, [allowDoctorPick, doctorSearch]);

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
    setSelectedLabel(`${nameOf(match)}${mobileOf(match) ? ` · ${mobileOf(match)}` : ""}`);
  }, [patients, book.patientId]);

  const filteredPatients = useMemo(() => {
    const q = String(patientSearch || "").trim().toLowerCase();
    const qDigits = digitsOnly(q);
    if (!q) return patients.slice(0, 8);
    return patients
      .filter((row) => {
        const name = String(nameOf(row) || "").toLowerCase();
        const mobile = String(mobileOf(row) || "").toLowerCase();
        const mobileDigits = digitsOnly(mobile);
        return (
          name.includes(q) ||
          mobile.includes(q) ||
          (qDigits.length >= 3 && mobileDigits.includes(qDigits))
        );
      })
      .slice(0, 20);
  }, [patients, patientSearch]);

  const filteredDoctors = useMemo(() => {
    if (!allowDoctorPick) return [];
    const q = String(doctorSearch || "").trim().toLowerCase();
    if (!q) return doctors.slice(0, 8);
    return doctors
      .filter((row) => {
        const name = String(row.name || "").toLowerCase();
        const clinic = String(row.clinicName || row.location || "").toLowerCase();
        return name.includes(q) || clinic.includes(q);
      })
      .slice(0, 20);
  }, [allowDoctorPick, doctors, doctorSearch]);

  const selectPatient = (row) => {
    const id = patientIdOf(row);
    setBook((prev) => ({ ...prev, patientId: id ? String(id) : "" }));
    setSelectedLabel(`${nameOf(row)}${mobileOf(row) ? ` · ${mobileOf(row)}` : ""}`);
    setPatientSearch("");
    setError("");
  };

  const selectDoctor = (row) => {
    const id = row.id ?? row.doctorId;
    setDoctorId(id ? String(id) : "");
    setSelectedDoctorLabel(`${row.name || "Doctor"}${row.clinicName ? ` · ${row.clinicName}` : ""}`);
    setDoctorSearch("");
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
      setError(
        allowDoctorPick
          ? "Select a doctor and a patient before booking."
          : "Select a patient before booking."
      );
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
        <div className="mb-2" data-testid="assisted-doctor-pick">
          <Label htmlFor="assisted-doctor-search">Find doctor</Label>
          <Input
            id="assisted-doctor-search"
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            placeholder="Type doctor name or clinic"
            autoComplete="off"
            data-testid="assisted-doctor-search"
          />
          <div className="d-flex justify-content-between align-items-center mt-1 mb-1">
            <small className="text-muted">
              {doctorsLoading ? "Loading doctors…" : "Search by name or clinic, then pick one"}
            </small>
            <Button
              color="link"
              size="sm"
              className="p-0"
              type="button"
              onClick={() => loadDoctors(doctorSearch)}
              disabled={doctorsLoading}
            >
              Refresh
            </Button>
          </div>
          {doctorsError ? <p className="text-warning small mb-1">{doctorsError}</p> : null}
          {doctorsLoading ? <Spinner size="sm" className="mb-2" /> : null}
          {!doctorsLoading && filteredDoctors.length > 0 ? (
            <ListGroup className="mb-2" flush style={{ maxHeight: 180, overflowY: "auto" }} data-testid="assisted-doctor-matches">
              {filteredDoctors.map((row) => {
                const id = row.id ?? row.doctorId;
                const active = String(id) === String(doctorId);
                return (
                  <ListGroupItem
                    key={id}
                    action
                    active={active}
                    tag="button"
                    type="button"
                    className="py-2"
                    onClick={() => selectDoctor(row)}
                    data-testid={`assisted-doctor-${id}`}
                  >
                    <div className="fw-medium text-truncate">{row.name || "Doctor"}</div>
                    <small className={active ? "" : "text-muted"}>
                      {row.clinicName || row.location || "Clinic"}
                    </small>
                  </ListGroupItem>
                );
              })}
            </ListGroup>
          ) : null}
          {!doctorsLoading && doctorSearch && filteredDoctors.length === 0 ? (
            <p className="text-muted small">No doctor match. Try another name.</p>
          ) : null}
          {selectedDoctorLabel ? (
            <Alert color="info" className="py-2">
              Doctor: <strong>{selectedDoctorLabel}</strong>
            </Alert>
          ) : null}
        </div>
      ) : null}

      <Label className={allowDoctorPick ? "mt-2" : undefined} htmlFor="assisted-patient-search">
        Find patient
      </Label>
      <Input
        id="assisted-patient-search"
        value={patientSearch}
        onChange={(e) => setPatientSearch(e.target.value)}
        placeholder="Type name or mobile"
        autoComplete="off"
        data-testid="assisted-patient-search"
      />
      <div className="d-flex justify-content-between align-items-center mt-1 mb-1">
        <small className="text-muted">
          {patientsLoading
            ? "Loading clinic patients…"
            : `${patients.length} patients — pick one, or use Book for… on the queue`}
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
                  {mobileOf(row) || "No mobile"}
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
        <Alert color="info" className="py-2" data-testid="assisted-patient-selected">
          Selected: <strong>{selectedLabel}</strong>
        </Alert>
      ) : (
        <p className="text-muted small mb-0">Search by name or mobile, then pick the patient.</p>
      )}

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
        disabled={saving || !doctorId || !book.patientId}
        data-testid="assisted-book-submit"
      >
        {saving ? "Booking…" : "Book for patient"}
      </Button>
    </div>
  );
};

export default AssistedBookWizard;
