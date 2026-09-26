import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import {
  erxByAppointment,
  erxPdf,
  s4Message,
  signErx,
  unwrapS4,
} from "../../../helpers/s4Week4Api";

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
      setSnapshot(unwrapS4(response));
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
    const erxId = snapshot?.erxId || snapshot?.ErxId || snapshot?.id;
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

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Sign eRx</h4>
        <p className="text-muted">
          Load the appointment prescription (no history notes), then lock the snapshot. Refills use the signed copy.
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col lg={4}>
            <Card>
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
                <Button color="primary" className="me-2" disabled={signing || !patientAppId} onClick={onSign}>
                  {signing ? "Signing…" : "Sign & lock"}
                </Button>
                <Button color="soft-info" disabled={!snapshot} onClick={onPdf}>
                  PDF
                </Button>
              </CardBody>
            </Card>
          </Col>
          <Col lg={8}>
            <Card>
              <CardBody>
                <h5>Snapshot</h5>
                {!snapshot ? (
                  <p className="text-muted mb-0">Load an appointment to preview the eRx payload.</p>
                ) : (
                  <pre className="small mb-0" style={{ whiteSpace: "pre-wrap", maxHeight: 480, overflow: "auto" }}>
                    {JSON.stringify(snapshot, null, 2)}
                  </pre>
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
