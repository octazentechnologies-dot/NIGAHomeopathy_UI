import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  listSmsEvents,
  listSmsTemplates,
  s4Message,
  saveSmsPreference,
  saveSmsTemplate,
  unwrapS4,
} from "../../../helpers/s5Week5Api";

const rowsOf = (value) => (Array.isArray(value) ? value : []);

/** COM-01.03 — doctor event switches and admin SMS templates. */
const DoctorSmsPage = ({ mode = "doctor" }) => {
  const isAdmin = mode === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState({ code: "", body: "", isActive: true });

  document.title = isAdmin ? "SMS templates | Niga Homeocentrum" : "SMS events | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = isAdmin ? await listSmsTemplates() : await listSmsEvents();
      setRows(rowsOf(unwrapS4(response)));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  const toggleEvent = async (row) => {
    const code = row.code || row.Code;
    setBusy(code);
    setError("");
    try {
      const response = await saveSmsPreference({
        templateCode: code,
        enabled: !(row.enabled ?? row.Enabled),
      });
      setRows(rowsOf(unwrapS4(response)));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy("");
    }
  };

  const saveTemplate = async () => {
    setBusy("save");
    setError("");
    try {
      const response = await saveSmsTemplate({
        code: draft.code,
        body: draft.body,
        isActive: draft.isActive,
      });
      setRows(rowsOf(unwrapS4(response)));
      setDraft({ code: "", body: "", isActive: true });
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">{isAdmin ? "SMS templates" : "SMS events"}</h2>
        <p className="clinic-page-subtitle">
          {isAdmin
            ? "Clinic message text. Provider keys stay in server configuration."
            : "Turn each clinic event on or off for your patients. Opted-out mobiles are still blocked."}
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <Card className="admin-dash-card">
            <CardBody>
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Message</th>
                    <th>{isAdmin ? "Active" : "Send for me"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-muted">No SMS templates yet.</td>
                    </tr>
                  ) : rows.map((row) => {
                    const code = row.code || row.Code;
                    const active = isAdmin ? (row.isActive ?? row.IsActive) : (row.enabled ?? row.Enabled);
                    return (
                      <tr key={code}>
                        <td>{code}</td>
                        <td>{row.body || row.Body}</td>
                        <td>
                          {isAdmin ? (active ? "Yes" : "No") : (
                            <Button
                              size="sm"
                              color={active ? "success" : "secondary"}
                              disabled={busy === code}
                              onClick={() => toggleEvent(row)}
                            >
                              {active ? "On" : "Off"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        )}
        {isAdmin ? (
          <Card className="admin-dash-card mt-3">
            <CardBody>
              <Row className="g-2">
                <Col md={3}>
                  <Label>Code</Label>
                  <Input value={draft.code} maxLength={40} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Label>Body</Label>
                  <Input value={draft.body} maxLength={500} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button className="account-primary-btn" disabled={busy === "save"} onClick={saveTemplate}>
                    Save template
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ) : null}
      </Container>
    </div>
  );
};

export default DoctorSmsPage;
