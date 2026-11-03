import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Container, Spinner, Table } from "reactstrap";
import { listSecurityAudit, s4Message, unwrapS4, verifySecurityAudit } from "../../../helpers/s5Week5Api";

const SecurityAuditPage = () => {
  const [rows, setRows] = useState([]);
  const [verify, setVerify] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  document.title = "Security audit | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listSecurityAudit({ page: 1, pageSize: 50 });
      const data = unwrapS4(response);
      const list = Array.isArray(data) ? data : data?.items || data?.rows || response?.data || [];
      setRows(Array.isArray(list) ? list : []);
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

  const onVerify = async () => {
    setError("");
    try {
      const response = await verifySecurityAudit();
      setVerify(unwrapS4(response) || response);
    } catch (err) {
      setError(s4Message(err));
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h2 className="clinic-page-title mb-1"><i className="ri-shield-keyhole-line" aria-hidden="true" />Security audit</h2>
            <p className="clinic-page-subtitle mb-0">Recent security events and a hash check of the log.</p>
          </div>
          <Button color="primary" onClick={onVerify}><i className="ri-shield-check-line" aria-hidden="true" /> Verify log</Button>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {verify ? (
          <Alert color={verify.intact ? "success" : "warning"}>
            Intact: {verify.intact ? "Yes" : "No"}. Rows checked: {verify.rowsChecked ?? "—"}.
            {verify.problem ? ` ${verify.problem}` : ""}
          </Alert>
        ) : null}
        {loading ? <Spinner size="sm" /> : null}
        <Card className="admin-dash-card"><CardBody className="p-0">
          <Table responsive className="mb-0">
            <thead>
              <tr><th>When</th><th>Event</th><th>Outcome</th><th>Actor</th><th>Role</th><th>Subject</th><th>Source</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={7} className="text-muted">No audit rows.</td></tr> : rows.map((row) => (
                <tr key={row.id || row.securityAuditId}>
                  <td>{row.occurredAtUtc ? String(row.occurredAtUtc).replace("T", " ").slice(0, 19) : "—"}</td>
                  <td>{row.eventType}</td>
                  <td>{row.outcome}</td>
                  <td>{row.actorUserId ?? "—"}</td>
                  <td>{row.actorRole || "—"}</td>
                  <td>{row.subject || "—"}</td>
                  <td>{row.sourceApi || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody></Card>
      </Container>
    </div>
  );
};

export default SecurityAuditPage;
