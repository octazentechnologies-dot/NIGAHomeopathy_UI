import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Label, ListGroup, ListGroupItem, Spinner } from "reactstrap";
import { getPatientList, getReceptionCasePapers, saveReceptionCasePaper } from "../../../helpers/realbackend_helper";
import { getAuthUserId } from "../../../helpers/menuByRole";
import { apiMessage, unwrap } from "../receptionSession";

const patientIdOf = (row) => row?.patientID ?? row?.patientId ?? row?.PatientID ?? row?.PatientId ?? null;
const caseIdOf = (row) => row?.caseId ?? row?.CaseId ?? null;
const nameOf = (row) => row?.patientName ?? row?.PatientName ?? "Patient";
const mobileOf = (row) => row?.mobileNo ?? row?.MobileNo ?? "";

/** Compact case paper on Reception home (REC-12 / checklist #46). */
const ReceptionHomeCasePaper = ({ queue = [], prefillPatientId, prefillLabel, onSelect }) => {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(prefillPatientId ? String(prefillPatientId) : "");
  const [caseId, setCaseId] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(prefillLabel || "");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    const userId = getAuthUserId();
    if (!userId) return;
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
    } catch {
      setPatients([]);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (!prefillPatientId) return;
    setPatientId(String(prefillPatientId));
    if (prefillLabel) setSelectedLabel(prefillLabel);
    loadPatients();
  }, [prefillPatientId, prefillLabel]);

  useEffect(() => {
    const loadHistory = async () => {
      const id = Number(patientId);
      if (!id) {
        setHistory([]);
        return;
      }
      try {
        const response = await getReceptionCasePapers(id);
        const body = unwrap(response);
        const nested = body.data || body.Data || body;
        const rows = Array.isArray(nested) ? nested : nested?.data || nested?.Data || [];
        setHistory(Array.isArray(rows) ? rows.slice(0, 5) : []);
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [patientId]);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const source = patients.length ? patients : queue;
    if (!q) return source.slice(0, 6);
    return source
      .filter((row) => {
        const name = String(nameOf(row) || row.patientName || row.PatientName || "").toLowerCase();
        const mobile = String(mobileOf(row) || "").toLowerCase();
        return name.includes(q) || mobile.includes(q);
      })
      .slice(0, 8);
  }, [patients, queue, search]);

  const selectPatient = (row) => {
    const id = patientIdOf(row) || row.patientId || row.PatientId;
    setPatientId(id ? String(id) : "");
    setCaseId(caseIdOf(row) ? String(caseIdOf(row)) : "");
    setSelectedLabel(`${nameOf(row) || row.patientName || row.PatientName}${mobileOf(row) ? ` · ${mobileOf(row)}` : ""}`);
    setSearch("");
    setError("");
    setNote("");
    if (id) onSelect?.({ patientId: String(id), label: `${nameOf(row) || row.patientName || row.PatientName}${mobileOf(row) ? ` · ${mobileOf(row)}` : ""}` });
  };

  const save = async () => {
    setError("");
    setNote("");
    const pid = Number(patientId);
    if (!pid) {
      setError("Pick a patient first.");
      return;
    }
    if (!String(chiefComplaint || "").trim()) {
      setError("Chief complaint is required.");
      return;
    }
    setSaving(true);
    try {
      await saveReceptionCasePaper({
        patientId: pid,
        caseId: caseId ? Number(caseId) : null,
        chiefComplaint: chiefComplaint.trim(),
      });
      setNote("Case paper saved for the doctor.");
      setChiefComplaint("");
      const response = await getReceptionCasePapers(pid);
      const body = unwrap(response);
      const nested = body.data || body.Data || body;
      const rows = Array.isArray(nested) ? nested : [];
      setHistory(Array.isArray(rows) ? rows.slice(0, 5) : []);
    } catch (err) {
      setError(apiMessage(err, "Could not save the case paper."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="reception-home-case-paper">
      {error ? <Alert color="danger">{error}</Alert> : null}
      {note ? <Alert color="success">{note}</Alert> : null}
      <Label htmlFor="rec-home-cc-search">Find patient</Label>
      <Input
        id="rec-home-cc-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Name or mobile"
        autoComplete="off"
      />
      {filtered.length > 0 ? (
        <ListGroup className="mt-2 mb-2" flush style={{ maxHeight: 140, overflowY: "auto" }}>
          {filtered.map((row) => {
            const id = patientIdOf(row) || row.patientId || row.PatientId;
            return (
              <ListGroupItem
                key={id}
                action
                tag="button"
                type="button"
                className="py-2"
                onClick={() => selectPatient(row)}
              >
                <div className="fw-medium text-truncate">
                  {nameOf(row) || row.patientName || row.PatientName}
                </div>
                <small className="text-muted">{mobileOf(row) || "No mobile"}</small>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      ) : null}
      {selectedLabel ? (
        <p className="small mb-2">
          Selected: <strong>{selectedLabel}</strong>
        </p>
      ) : (
        <p className="text-muted small">Pick a patient, then log the reason for visit.</p>
      )}
      <Label htmlFor="rec-home-cc">Chief complaint</Label>
      <Input
        id="rec-home-cc"
        type="textarea"
        rows={2}
        value={chiefComplaint}
        onChange={(e) => setChiefComplaint(e.target.value)}
        placeholder="Short reason for visit"
      />
      <Button className="reception-primary-btn mt-2" type="button" disabled={saving || !patientId} onClick={save}>
        {saving ? <Spinner size="sm" /> : "Save case paper"}
      </Button>
      {history.length > 0 ? (
        <ul className="small mt-3 mb-0 ps-3">
          {history.map((row, index) => (
            <li key={row.caseChiefComplaintId || row.CaseChiefComplaintId || index}>
              {row.chiefComplaintName || row.ChiefComplaintName || row.chiefComplaint || row.ChiefComplaint}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default ReceptionHomeCasePaper;
