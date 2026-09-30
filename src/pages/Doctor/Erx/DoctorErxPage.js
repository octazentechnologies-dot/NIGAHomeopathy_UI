import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  erxByAppointment,
  erxPdf,
  s4Message,
  signErx,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { getAppointmentList } from "../../../helpers/realbackend_helper";

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const asSnapshot = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.items || payload.Items || payload.erxSnapshotId || payload.ErxSnapshotId) return payload;
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
};

/**
 * ERX — load appointment prescription snapshot and sign (locks). PDF via New API.
 */
const DoctorErxPage = () => {
  const [searchParams] = useSearchParams();
  const [patientAppId, setPatientAppId] = useState(() => searchParams.get("patientAppId") || "");
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [visits, setVisits] = useState([]);

  document.title = "eRx sign | Niga Homeocentrum";

  const load = async (idOverride) => {
    const raw = idOverride != null && typeof idOverride !== "object" ? idOverride : patientAppId;
    const id = Number(raw);
    if (!id) {
      setError("Enter a patient appointment id.");
      return;
    }
    setLoading(true);
    setError("");
    setNote("");
    try {
      const response = await erxByAppointment(id);
      setSnapshot(asSnapshot(unwrapS4(response)));
    } catch (err) {
      setSnapshot(null);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromQuery = searchParams.get("patientAppId");
    if (fromQuery) setPatientAppId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    const fromQuery = Number(searchParams.get("patientAppId"));
    if (fromQuery > 0) load(fromQuery);
  }, []);

  useEffect(() => {
    let userId = "";
    try {
      const parsed = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      userId = parsed.userId || parsed.UserId || parsed.data?.userId || parsed.id || "";
    } catch (_) {
      userId = "";
    }
    if (!userId) return undefined;
    let cancelled = false;
    getAppointmentList({ userId, appointmentDate: new Date().toISOString() })
      .then((response) => {
        const body = response?.data ?? response;
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];
        if (!cancelled) setVisits(list);
      })
      .catch(() => {
        if (!cancelled) setVisits([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visitIdOf = (row) =>
    row?.patientAppId || row?.patientAppID || row?.PatientAppId || row?.appointmentId || row?.AppointmentId || "";

  const visitLabel = (row) => {
    const id = visitIdOf(row);
    const name = row?.patientName || row?.PatientName || row?.name || row?.fullName || "Patient";
    const time = row?.appointmentTime || row?.AppointmentTime || row?.time || "";
    return `${name}${time ? ` · ${time}` : ""} · visit ${id}`;
  };

  const onSign = async () => {
    const id = Number(patientAppId);
    setSigning(true);
    setError("");
    try {
      const response = await signErx({ patientAppId: id });
      setNote(unwrapS4(response)?.message || response?.message || "Prescription signed and locked.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSigning(false);
    }
  };

  const onPdf = async () => {
    const erxId = pick(snapshot, "erxId", "ErxId", "erxSnapshotId", "ErxSnapshotId", "id");
    if (!erxId) {
      setError("No eRx id to open as PDF.");
      return;
    }
    try {
      await erxPdf(erxId);
      setNote(`PDF request sent for eRx #${erxId}.`);
    } catch (err) {
      setError(s4Message(err));
    }
  };

  const items = Array.isArray(snapshot?.items)
    ? snapshot.items
    : Array.isArray(snapshot?.Items)
      ? snapshot.Items
      : [];

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Sign eRx</h2>
        <p className="clinic-page-subtitle">
          Pick today&apos;s visit, or open Sign eRx from Patient Board on that visit. The visit id is filled in for you.
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col lg={4}>
            <Card className="admin-dash-card">
              <CardBody>
                <FormGroup>
                  <Label>Today&apos;s visit</Label>
                  <Input
                    type="select"
                    value={visits.some((row) => String(visitIdOf(row)) === String(patientAppId)) ? String(patientAppId) : ""}
                    onChange={(e) => {
                      setPatientAppId(e.target.value);
                      if (e.target.value) load(e.target.value);
                    }}
                  >
                    <option value="">{visits.length ? "Select a patient" : "No visits loaded for today"}</option>
                    {visits.map((row) => {
                      const id = visitIdOf(row);
                      if (!id) return null;
                      return (
                        <option key={id} value={id}>
                          {visitLabel(row)}
                        </option>
                      );
                    })}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Visit id</Label>
                  <Input
                    type="number"
                    min={1}
                    value={patientAppId}
                    onChange={(e) => setPatientAppId(e.target.value)}
                  />
                  <div className="text-muted small mt-1">
                    Use this only when the visit is not in today&apos;s list. Patient Board already sends the id.
                  </div>
                </FormGroup>
                <Button color="soft-secondary" className="me-2" disabled={loading || !patientAppId} onClick={() => load()}>
                  {loading ? <Spinner size="sm" /> : "Load"}
                </Button>
                <Button className="clinic-primary-btn me-2" disabled={signing || !patientAppId} onClick={onSign}>
                  {signing ? "Signing…" : "Sign & lock"}
                </Button>
                <Button color="soft-info" disabled={!snapshot} onClick={onPdf}>
                  PDF
                </Button>
              </CardBody>
            </Card>
          </Col>
          <Col lg={8}>
            <Card className="admin-dash-card">
              <CardBody>
                <h5>Prescription</h5>
                {!snapshot ? (
                  <p className="text-muted mb-0">Load an appointment to preview the signed prescription.</p>
                ) : (
                  <>
                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <div className="text-muted small">eRx</div>
                        <div>#{pick(snapshot, "erxSnapshotId", "ErxSnapshotId", "erxId", "ErxId") || "—"}</div>
                      </Col>
                      <Col md={4}>
                        <div className="text-muted small">Visit</div>
                        <div>#{pick(snapshot, "patientAppId", "PatientAppId") || "—"}</div>
                      </Col>
                      <Col md={4}>
                        <div className="text-muted small">Status</div>
                        <div>{pick(snapshot, "status", "Status") || "—"}</div>
                      </Col>
                      <Col md={6}>
                        <div className="text-muted small">Signed at</div>
                        <div>
                          {pick(snapshot, "signedAt", "SignedAt")
                            ? new Date(pick(snapshot, "signedAt", "SignedAt")).toLocaleString("en-IN")
                            : "—"}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="text-muted small">History notes</div>
                        <div>{pick(snapshot, "notesIncluded", "NotesIncluded") ? "Included" : "Not included"}</div>
                      </Col>
                    </Row>
                    {items.length === 0 ? (
                      <p className="text-muted mb-0">No remedy lines on this snapshot.</p>
                    ) : (
                      <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0" size="sm">
                          <thead>
                            <tr>
                              <th>Remedy</th>
                              <th>Potency</th>
                              <th>Dose</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((row, index) => (
                              <tr key={pick(row, "erxSnapshotItemId", "ErxSnapshotItemId") || index}>
                                <td>{pick(row, "remedyName", "RemedyName", "remedyCode", "RemedyCode") || "—"}</td>
                                <td>{pick(row, "potencyCode", "PotencyCode") || "—"}</td>
                                <td>{pick(row, "dose", "Dose") || "—"}</td>
                                <td>{pick(row, "frequency", "Frequency") || "—"}</td>
                                <td>{pick(row, "duration", "Duration") || "—"}</td>
                                <td>{pick(row, "instructions", "Instructions") || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DoctorErxPage;
