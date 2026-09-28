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

  document.title = "eRx sign | Niga Homeocentrum";

  const load = async (idOverride) => {
    const id = Number(idOverride ?? patientAppId);
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
          Load the appointment prescription (no history notes), then lock the snapshot. Refills use the signed copy.
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col lg={4}>
            <Card className="admin-dash-card">
              <CardBody>
                <FormGroup>
                  <Label>Patient appointment id</Label>
                  <Input
                    type="number"
                    min={1}
                    value={patientAppId}
                    onChange={(e) => setPatientAppId(e.target.value)}
                  />
                </FormGroup>
                <Button color="soft-secondary" className="me-2" disabled={loading} onClick={load}>
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
