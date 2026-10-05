import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Col, Container, Row, Spinner, Table } from "reactstrap";
import {
  clinicPerformance,
  followUpDue,
  followUpSummary,
  medicineReport,
  s4Message,
  unwrapS4,
} from "../../../helpers/s5Week5Api";

const titles = {
  followup: ["Follow-up analysis", "Open follow-ups that are due, plus counts by status."],
  performance: ["Clinic performance", "Visits by mode and paid collections for the last 30 days."],
  medicine: ["Medicine orders", "Order counts for the clinic medicine report."],
};

const ClinicReportPage = ({ mode = "followup" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, subtitle] = titles[mode] || titles.followup;

  document.title = `${title} | Niga Homeocentrum`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = mode === "performance"
          ? await clinicPerformance({})
          : mode === "medicine"
            ? await medicineReport()
            : await Promise.all([followUpDue(), followUpSummary()]);
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) setError(s4Message(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const due = mode === "followup" ? unwrapS4(data?.[0]) : [];
  const summary = mode === "followup" ? unwrapS4(data?.[1]) : [];
  const visits = Array.isArray(data?.visits) ? data.visits : Array.isArray(data?.Visits) ? data.Visits : [];
  const paid = data?.paid || data?.Paid || null;
  const medicineRows = mode === "medicine" ? (Array.isArray(unwrapS4(data)) ? unwrapS4(data) : []) : [];

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">{title}</h2>
        <p className="clinic-page-subtitle">{subtitle}</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? <Spinner size="sm" /> : null}
        {mode === "followup" && !loading ? (
          <Row className="g-3">
            <Col md={4}>
              <Card className="admin-dash-card"><CardBody>
                <div className="text-muted small mb-2">By status</div>
                {(summary || []).map((row) => (
                  <div key={row.name || row.Name}>{row.name || row.Name}: {row.cnt ?? row.Cnt}</div>
                ))}
                {(summary || []).length === 0 ? <div className="text-muted">No follow-up tasks.</div> : null}
              </CardBody></Card>
            </Col>
            <Col md={8}>
              <Card className="admin-dash-card"><CardBody>
                <Table responsive className="mb-0">
                  <thead><tr><th>Due</th><th>Title</th><th>Patient</th><th>Status</th></tr></thead>
                  <tbody>
                    {(due || []).length === 0 ? (
                      <tr><td colSpan="4" className="text-muted">No open follow-ups are due.</td></tr>
                    ) : (due || []).map((row) => (
                      <tr key={row.followUpTaskId || row.FollowUpTaskId}>
                        <td>{String(row.dueDate || row.DueDate || "").slice(0, 10)}</td>
                        <td>{row.title || row.Title}</td>
                        <td>{row.patientId || row.PatientId}</td>
                        <td>{row.status || row.Status}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody></Card>
            </Col>
          </Row>
        ) : null}
        {mode === "performance" && !loading && data ? (
          <Row className="g-3">
            <Col md={4}>
              <Card className="admin-dash-card"><CardBody>
                <div className="text-muted small">Paid orders</div>
                <div className="fs-4">{paid?.cnt ?? paid?.Cnt ?? 0}</div>
                <div>₹ {Number(paid?.amount ?? paid?.Amount ?? 0).toLocaleString("en-IN")}</div>
              </CardBody></Card>
            </Col>
            <Col md={8}>
              <Card className="admin-dash-card"><CardBody>
                {visits.length === 0 ? <div className="text-muted">No visits in this window.</div> : visits.map((row) => (
                  <div key={row.name || row.Name}>{row.name || row.Name}: {row.cnt ?? row.Cnt}</div>
                ))}
              </CardBody></Card>
            </Col>
          </Row>
        ) : null}
        {mode === "medicine" && !loading ? (
          <Card className="admin-dash-card"><CardBody>
            <Table responsive className="mb-0">
              <thead><tr><th>Status</th><th>Orders</th></tr></thead>
              <tbody>
                {medicineRows.length === 0 ? (
                  <tr><td colSpan="2" className="text-muted">No medicine orders.</td></tr>
                ) : medicineRows.map((row) => (
                  <tr key={row.name || row.Name || row.status || row.Status}>
                    <td>{row.name || row.Name || row.status || row.Status}</td>
                    <td>{row.cnt ?? row.Cnt ?? row.count ?? row.Count ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody></Card>
        ) : null}
      </Container>
    </div>
  );
};

export default ClinicReportPage;
