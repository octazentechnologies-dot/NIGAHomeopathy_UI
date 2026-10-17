import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import { listPackageTopups, s4Message, savePackageTopup } from "../../../helpers/s5Week5Api";

const rowsOf = (response) => {
  const body = response?.data ?? response?.Data ?? response;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.Data)) return body.Data;
  return [];
};

const PackageTopupsPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ packageTopupName: "", caseCount: "", topupAmount: "" });
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  document.title = "Package top-ups | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(rowsOf(await listPackageTopups({ pageNumber: 1, pageSize: 50 })));
    } catch (err) {
      setError(s4Message(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      let actor = "admin";
      try {
        const stored = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        actor = stored.loginId || stored.userName || stored.UserName || actor;
      } catch {
        actor = "admin";
      }
      await savePackageTopup({
        packageTopupName: form.packageTopupName.trim(),
        caseCount: Number(form.caseCount),
        topupAmount: Number(form.topupAmount),
        enteredBy: actor,
        changedBy: actor,
      });
      setForm({ packageTopupName: "", caseCount: "", topupAmount: "" });
      setNote("Top-up saved.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Package top-ups</h2>
        <p className="clinic-page-subtitle">Extra case packs sold on top of a package.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card className="admin-dash-card mb-3"><CardBody>
          <Row className="g-2 align-items-end">
            <Col md={4}><Label>Name</Label><Input value={form.packageTopupName} onChange={(e) => setForm({ ...form, packageTopupName: e.target.value })} /></Col>
            <Col md={3}><Label>Case count</Label><Input type="number" min="1" value={form.caseCount} onChange={(e) => setForm({ ...form, caseCount: e.target.value })} /></Col>
            <Col md={3}><Label>Amount</Label><Input type="number" min="0" step="0.01" value={form.topupAmount} onChange={(e) => setForm({ ...form, topupAmount: e.target.value })} /></Col>
            <Col md={2}><Button color="primary" disabled={busy || !form.packageTopupName.trim()} onClick={save}>Save</Button></Col>
          </Row>
        </CardBody></Card>
        {loading ? <Spinner size="sm" /> : null}
        <Table responsive>
          <thead><tr><th>Name</th><th>Cases</th><th>Amount</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={3} className="text-muted">No top-ups saved.</td></tr> : rows.map((row) => (
              <tr key={row.packageTopupId || row.PackageTopupId}>
                <td>{row.packageTopupName || row.PackageTopupName}</td>
                <td>{row.caseCount ?? row.CaseCount}</td>
                <td>{row.topupAmount ?? row.TopupAmount}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default PackageTopupsPage;
