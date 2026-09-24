import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, ListGroup, ListGroupItem, Row, Spinner } from "reactstrap";
import { getPatientList, getReceptionCasePapers, saveReceptionCasePaper } from "../../helpers/realbackend_helper";
import { getAuthUserId } from "../../helpers/menuByRole";
import { apiMessage, unwrap } from "./receptionSession";

const patientIdOf = (row) => row?.patientID ?? row?.patientId ?? row?.PatientID ?? row?.PatientId ?? null;
const caseIdOf = (row) => row?.caseId ?? row?.CaseId ?? null;
const nameOf = (row) => row?.patientName ?? row?.PatientName ?? "Patient";
const mobileOf = (row) => row?.mobileNo ?? row?.MobileNo ?? "";

const ReceptionCasePaper = () => {
  const [params] = useSearchParams();
  const [patientId, setPatientId] = useState(params.get("patientId") || "");
  const [patientAppId, setPatientAppId] = useState(params.get("patientAppId") || "");
  const [caseId, setCaseId] = useState(params.get("caseId") || "");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyNote, setHistoryNote] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadPatients = async () => {
    const userId = getAuthUserId();
    if (!userId) {
      setPatientsError("Clinic doctor context is missing. Sign in again as reception.");
      return;
    }
    setPatientsLoading(true);
    setPatientsError("");
    try {
      const response = await getPatientList({ userId });
      const rows = unwrap(response);
      const list = Array.isArray(rows) ? rows : rows?.data || rows?.Data || [];
      // One row per patient (API returns cases).
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
    document.title = "Case paper | Homeocentrum";
    loadPatients();
  }, []);

  useEffect(() => {
    const nextPatient = params.get("patientId");
    const nextApp = params.get("patientAppId");
    const nextCase = params.get("caseId");
    if (nextPatient) setPatientId(nextPatient);
    if (nextApp) setPatientAppId(nextApp);
    if (nextCase) setCaseId(nextCase);
  }, [params]);

  useEffect(() => {
    if (!patientId || !patients.length) return;
    const match = patients.find((row) => String(patientIdOf(row)) === String(patientId));
    if (!match) return;
    setSelectedLabel(`${nameOf(match)} · ${mobileOf(match) || "no mobile"} · ID ${patientIdOf(match)}`);
    if (!caseId && caseIdOf(match)) setCaseId(String(caseIdOf(match)));
  }, [patients, patientId]);

  const filteredPatients = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return patients.slice(0, 12);
    return patients
      .filter((row) => {
        const id = String(patientIdOf(row) || "");
        const name = String(nameOf(row) || "").toLowerCase();
        const mobile = String(mobileOf(row) || "").toLowerCase();
        return name.includes(q) || mobile.includes(q) || id.includes(q);
      })
      .slice(0, 20);
  }, [patients, search]);

  const selectPatient = (row) => {
    const id = patientIdOf(row);
    const cId = caseIdOf(row);
    setPatientId(id ? String(id) : "");
    setCaseId(cId ? String(cId) : "");
    setSelectedLabel(`${nameOf(row)} · ${mobileOf(row) || "no mobile"} · ID ${id}`);
    setSearch("");
    setError("");
    setMessage("");
  };

  const loadHistory = async (id) => {
    const patient = Number(id);
    if (!patient) {
      setHistory([]);
      setHistoryNote("");
      return;
    }
    setLoadingHistory(true);
    setHistoryNote("");
    try {
      const response = await getReceptionCasePapers(patient);
      const body = unwrap(response);
      const nested = body.data || body.Data || body;
      const rows = Array.isArray(nested) ? nested : nested?.data || nested?.Data || [];
      setHistory(Array.isArray(rows) ? rows : []);
      if (!Array.isArray(rows) || rows.length === 0) {
        setHistoryNote("No prior chief complaints for this patient.");
      }
    } catch (err) {
      setHistory([]);
      setHistoryNote(apiMessage(err, "Could not load prior notes."));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory(patientId);
  }, [patientId]);

  const save = async () => {
    setError("");
    setMessage("");
    const pid = Number(patientId);
    if (!pid) {
      setError("Select a patient from search (or open Case paper from the queue with an ID link).");
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
        patientAppId: patientAppId ? Number(patientAppId) : null,
        caseId: caseId ? Number(caseId) : null,
        chiefComplaint: chiefComplaint.trim(),
      });
      setMessage("Case paper saved for the doctor. Repertory was not opened.");
      setChiefComplaint("");
      await loadHistory(pid);
    } catch (err) {
      setError(apiMessage(err, "Could not save the case paper."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Case paper</h4>
        <p className="text-muted">
          Log the reason for visit before consultation. Search the clinic patient list — you do not need to memorize numeric IDs.
        </p>
        <Row className="g-3">
          <Col lg={6}>
            <Card>
              <CardBody>
                {error ? <Alert color="danger">{error}</Alert> : null}
                {message ? <Alert color="success">{message}</Alert> : null}
                {patientsError ? <Alert color="warning">{patientsError}</Alert> : null}

                <Label htmlFor="rec-cc-search">Find patient</Label>
                <Input
                  id="rec-cc-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Type name, mobile, or id"
                  autoComplete="off"
                />
                <div className="d-flex justify-content-between align-items-center mt-1 mb-2">
                  <small className="text-muted">
                    {patientsLoading ? "Loading clinic patients…" : `${patients.length} patients for this doctor`}
                  </small>
                  <Button color="link" size="sm" className="p-0" type="button" onClick={loadPatients} disabled={patientsLoading}>
                    Refresh
                  </Button>
                </div>
                {patientsLoading ? <Spinner size="sm" /> : null}
                {!patientsLoading && filteredPatients.length > 0 ? (
                  <ListGroup className="mb-3" flush style={{ maxHeight: 220, overflowY: "auto" }}>
                    {filteredPatients.map((row) => {
                      const id = patientIdOf(row);
                      const active = String(id) === String(patientId);
                      return (
                        <ListGroupItem
                          key={`${id}-${caseIdOf(row) || 0}`}
                          action
                          active={active}
                          tag="button"
                          type="button"
                          onClick={() => selectPatient(row)}
                          className="py-2"
                        >
                          <div className="fw-medium text-truncate">{nameOf(row)}</div>
                          <small className={active ? "" : "text-muted"}>
                            {mobileOf(row) || "No mobile"} · ID {id}
                            {caseIdOf(row) ? ` · Case ${caseIdOf(row)}` : ""}
                          </small>
                        </ListGroupItem>
                      );
                    })}
                  </ListGroup>
                ) : null}
                {!patientsLoading && search && filteredPatients.length === 0 ? (
                  <p className="text-muted small">No match. Try another name/mobile, or register the patient first.</p>
                ) : null}

                {selectedLabel ? (
                  <Alert color="info" className="py-2">
                    Selected: <strong>{selectedLabel}</strong>
                  </Alert>
                ) : (
                  <p className="text-muted small">Or open Case paper from Reception queue after clicking the patient <strong>ID</strong> link.</p>
                )}

                <Label className="mt-1" htmlFor="rec-cc-text">Chief complaint</Label>
                <Input
                  id="rec-cc-text"
                  type="textarea"
                  rows={4}
                  value={chiefComplaint}
                  onChange={(event) => setChiefComplaint(event.target.value)}
                  placeholder="Short reason for visit"
                />
                <Button className="mt-3" color="primary" disabled={saving || !patientId} onClick={save}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <div className="mt-3">
                  <Link to="/reception">Back to reception</Link>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg={6}>
            <Card>
              <CardBody>
                <h5 className="mb-2">Prior notes</h5>
                {loadingHistory ? <Spinner size="sm" /> : null}
                {historyNote ? <p className="text-muted mb-0">{historyNote}</p> : null}
                {!loadingHistory && history.length > 0 ? (
                  <ul className="mb-0 ps-3">
                    {history.map((row) => {
                      const key =
                        row.caseChiefComplaintId ||
                        row.CaseChiefComplaintId ||
                        row.receptionCasePaperId ||
                        row.ReceptionCasePaperId;
                      const text =
                        row.chiefComplaintName ||
                        row.ChiefComplaintName ||
                        row.chiefComplaint ||
                        row.ChiefComplaint ||
                        "";
                      const at = row.createdAt || row.CreatedAt || "";
                      const role = row.createdByRole || row.CreatedByRole || "Reception";
                      return (
                        <li key={key} className="mb-2">
                          <div>{text}</div>
                          <small className="text-muted">
                            {role}
                            {at ? ` · ${String(at).replace("T", " ").slice(0, 19)}` : ""}
                          </small>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ReceptionCasePaper;
