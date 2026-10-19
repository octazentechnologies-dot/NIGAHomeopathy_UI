import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Container, Spinner, Table } from "reactstrap";
import { listConsentAudit, s4Message, unwrapS4 } from "../../../helpers/s5Week5Api";

const ConsentAuditPage = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  document.title = "Consent audit | Niga Homeocentrum";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await listConsentAudit(200);
        const data = unwrapS4(response);
        const list = Array.isArray(data) ? data : data?.items || response?.data || [];
        if (!cancelled) setRows(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(s4Message(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Consent audit</h2>
        <p className="clinic-page-subtitle">Who granted or withdrew a consent, and which notice version was shown.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
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
