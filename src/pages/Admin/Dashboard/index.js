import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { adminOverview, s4Message } from "../../../helpers/s5Week5Api";

/** RPT-01.03 — clinic admin home. The old store widgets are not this product. */
const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  document.title = "Dashboard | Niga Homeocentrum";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await adminOverview();
        if (!cancelled) setData(response?.data || response);
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

  const cards = [
    ["Appointments", data?.appointments],
    ["Medicine orders", data?.medicineOrders],
    ["Open follow-ups", data?.openFollowUps],
  ];
  const links = [
    ["/admin/sms", "SMS templates"],
    ["/admin/medicine-report", "Medicine report"],
    ["/admin/consult-payments", "Consult payments"],
    ["/admin/security", "Security posture"],
    ["/admin/listusers", "Users"],
    ["/admin/trust-queue", "Trust queue"],
  ];

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Clinic dashboard</h2>
        <p className="clinic-page-subtitle">Appointments, medicine orders, and open follow-ups from the clinic database.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? <Spinner size="sm" /> : (
          <Row className="g-3 mb-3">
            {cards.map(([label, value]) => (
              <Col md={4} key={label}>
                <Card className="admin-dash-card">
                  <CardBody>
                    <div className="text-muted small">{label}</div>
                    <div className="fs-4">{value ?? 0}</div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <Row className="g-2">
          {links.map(([to, label]) => (
            <Col md={4} key={to}>
              <Link to={to} className="btn btn-soft-secondary w-100">{label}</Link>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
