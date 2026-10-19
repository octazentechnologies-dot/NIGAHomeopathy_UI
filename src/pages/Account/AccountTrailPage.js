import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import { getAccountTrail, s4Message, unwrapS4 } from "../../helpers/s4Week4Api";

const AccountTrailPage = () => {
  const location = useLocation();
  const adminReportsBase = location.pathname.startsWith("/admin");
  const reportsHome = adminReportsBase ? "/admin/reports" : "/account/reports";
  const [form, setForm] = useState({ doctorId: "", patientAppId: "", paymentOrderId: "" });
  const [orders, setOrders] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  document.title = "Account trail | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (form.doctorId) params.doctorId = Number(form.doctorId);
      if (form.patientAppId) params.patientAppId = Number(form.patientAppId);
      if (form.paymentOrderId) params.paymentOrderId = Number(form.paymentOrderId);
      const data = unwrapS4(await getAccountTrail(params)) || {};
      const body = data.orders || data.Orders ? data : (data.data || data);
      setOrders(body.orders || body.Orders || []);
      setExceptions(body.exceptions || body.Exceptions || []);
    } catch (err) {
      setError(s4Message(err));
      setOrders([]);
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Account trail</h2>
            <p className="clinic-page-subtitle mb-0">
              Payment orders and exceptions for one appointment, payment, or doctor.
            </p>
          </div>
          <div className="clinic-table-actions">
            <Link to={reportsHome} className="btn btn-sm btn-soft-secondary clinic-action-btn">
              <i className="ri-arrow-left-line" aria-hidden="true" />
              Back to reports
            </Link>
          </div>
        </div>
        <Card className="admin-dash-card mb-3">
          <CardBody>
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Label>Doctor id</Label>
                <Input value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} />
              </Col>
              <Col md={3}>
                <Label>Appointment id</Label>
                <Input
                  value={form.patientAppId}
                  onChange={(e) => setForm({ ...form, patientAppId: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Label>Payment order id</Label>
                <Input
                  value={form.paymentOrderId}
                  onChange={(e) => setForm({ ...form, paymentOrderId: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Button color="primary" disabled={loading} onClick={load}>
                  Show trail
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? <Spinner size="sm" /> : null}
        <h5>Orders</h5>
        <Table responsive>
          <thead>
            <tr>
              <th>Order</th>
              <th>Stream</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Method</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No orders for this search.
                </td>
              </tr>
            ) : (
              orders.map((row) => (
                <tr key={row.paymentOrderId}>
                  <td>{row.paymentOrderId}</td>
                  <td>{row.stream}</td>
                  <td>
                    {row.amount} {row.currency || ""}
                  </td>
                  <td>{row.status}</td>
                  <td>{row.method || "—"}</td>
                  <td>{row.createdAt ? String(row.createdAt).replace("T", " ").slice(0, 19) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <h5>Exceptions</h5>
        <Table responsive>
          <thead>
            <tr>
              <th>Id</th>
              <th>Order</th>
              <th>Kind</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No exceptions for this search.
                </td>
              </tr>
            ) : (
              exceptions.map((row) => (
                <tr key={row.paymentExceptionId}>
                  <td>{row.paymentExceptionId}</td>
                  <td>{row.paymentOrderId}</td>
                  <td>{row.kind}</td>
                  <td>{row.status}</td>
                  <td>{row.detail || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default AccountTrailPage;
