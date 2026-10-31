import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Col, Container, Row, Spinner, Table } from "reactstrap";
import { clinicMessage, getDoctorActivity, getPracticeInsights, getPracticeStats, unwrapClinic } from "../../../helpers/doctorClinicApi";

const numberText = (value) => (value == null || value === "" ? "—" : String(value));

const Stat = ({ label, value }) => (
  <Col md={4} sm={6}>
    <Card className="admin-dash-card admin-kpi-card h-100">
      <CardBody>
        <div className="text-muted small">{label}</div>
        <div className="fs-5 fw-semibold">{numberText(value)}</div>
      </CardBody>
    </Card>
  </Col>
);

const DoctorPracticePage = () => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  document.title = "Practice | Niga Homeocentrum";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, insightsRes, activityRes] = await Promise.all([
          getPracticeStats(),
          getPracticeInsights(),
          getDoctorActivity(),
        ]);
        if (cancelled) return;
        setStats(unwrapClinic(statsRes) || null);
        setInsights(unwrapClinic(insightsRes) || null);
        const rows = unwrapClinic(activityRes);
        setActivity(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!cancelled) setError(clinicMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const show = stats || {};
  const insight = insights || {};

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title"><i className="ri-pulse-line" aria-hidden="true" />Practice</h2>
        <p className="clinic-page-subtitle">Stored visit counts, the insights summary, and the last 30 appointments.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? <Spinner size="sm" /> : null}
        <h5 className="mt-3">Practice stats</h5>
        <Row className="g-3">
          <Stat label="Completed visits" value={show.completedVisits} />
          <Stat label="Cancelled visits" value={show.cancelledVisits} />
          <Stat label="Completion %" value={show.completionPct ?? show.completionRate} />
          <Stat label="Lifetime consults" value={show.lifetimeConsultCount} />
          <Stat label="Signed notes" value={show.signedNoteCount} />
          <Stat label="Note signing %" value={show.noteSigningPct} />
          <Stat label="Average rating" value={show.averageRating} />
          <Stat label="Reviews" value={show.reviewCount} />
          <Stat label="Account age (days)" value={show.accountAgeDays} />
          <Stat label="Attended %" value={show.attendedPct} />
        </Row>
        <h5 className="mt-4">Insights</h5>
        <Row className="g-3">
          <Stat label="Completed visits" value={insight.completedVisits} />
          <Stat label="Completion %" value={insight.completionPct ?? insight.completionRate} />
          <Stat label="Average rating" value={insight.averageRating} />
        </Row>
        <h5 className="mt-4">Activity</h5>
        <Card className="admin-dash-card">
          <CardBody className="p-0">
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted">No recent appointments.</td>
                  </tr>
                ) : activity.map((row) => (
                  <tr key={row.patientAppId || `${row.at}-${row.patientName}`}>
                    <td>{row.at ? String(row.at).replace("T", " ").slice(0, 16) : "—"}</td>
                    <td>{row.patientName || "—"}</td>
                    <td>{row.status || "—"}</td>
                    <td>{row.consultMode || "—"}</td>
                    <td>{row.paymentStatus || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default DoctorPracticePage;
