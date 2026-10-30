import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Container, Spinner, Table } from "reactstrap";
import { listConsentAudit, s4Message, unwrapS4, verifyConsentAudit } from "../../../helpers/s5Week5Api";

const ConsentAuditPage = () => {
  const [rows, setRows] = useState([]);
  const [verify, setVerify] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  document.title = "Consent audit | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listConsentAudit(200);
      const data = unwrapS4(response);
      const list = Array.isArray(data) ? data : data?.items || response?.data || [];
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
      const response = await verifyConsentAudit();
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
            <h2 className="clinic-page-title mb-1"><i className="ri-file-shield-2-line" aria-hidden="true" />Consent audit</h2>
            <p className="clinic-page-subtitle mb-0">Who granted or withdrew a consent, and which notice version was shown.</p>
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
              <tr><th>When</th><th>Type</th><th>Subject</th><th>Granted by</th><th>Withdrawn</th><th>Notice</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={6} className="text-muted">No consent records.</td></tr> : rows.map((row) => (
                <tr key={row.consentRecordId}>
                  <td>{row.grantedAt ? String(row.grantedAt).replace("T", " ").slice(0, 19) : "—"}</td>
                  <td>{row.consentTypeCode}</td>
                  <td>{row.subjectType} {row.subjectId}</td>
                  <td>{row.grantedByUserId ?? "—"}</td>
                  <td>{row.withdrawnAt ? String(row.withdrawnAt).replace("T", " ").slice(0, 19) : "—"}</td>
                  <td>{[row.noticeVersion, row.noticeLanguage].filter(Boolean).join(" / ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody></Card>
      </Container>
    </div>
  );
};

export default ConsentAuditPage;
