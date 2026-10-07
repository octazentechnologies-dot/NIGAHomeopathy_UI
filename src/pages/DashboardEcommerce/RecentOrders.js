import React from "react";
import { Card, CardBody, CardHeader, Col, Spinner } from "reactstrap";
import { appointmentStatusTone, consultModeLabel, formatDay, paymentLabel } from "./adminDashboardFormat";

const RecentOrders = ({ summary, loading }) => {
  const rows = summary?.recentAppointments || [];

  return (
    <Col xl={8}>
      <Card className="admin-dash-card">
        <CardHeader className="align-items-center d-flex admin-dash-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Recent Appointments</h4>
          <span className="text-muted small">Latest {rows.length || ""} in the selected period</span>
        </CardHeader>

        <CardBody>
          {loading && !summary ? (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner size="sm" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted mb-0">No appointments in this period.</p>
          ) : (
            <div className="table-responsive table-card">
              <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                <thead className="text-muted table-light">
                  <tr>
                    <th scope="col">Appointment</th>
                    <th scope="col">Patient</th>
                    <th scope="col">Doctor</th>
                    <th scope="col">Mode</th>
                    <th scope="col">Payment</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.patientAppId}>
                      <td className="fw-medium">#{item.patientAppId}</td>
                      <td>{item.patientName || `Patient #${item.patientId}`}</td>
                      <td>{item.doctorName || `Doctor #${item.doctorId}`}</td>
                      <td>{consultModeLabel(item)}</td>
                      <td>{paymentLabel(item.paymentStatus)}</td>
                      <td>
                        <span
                          className={`badge bg-${appointmentStatusTone(item.status)}-subtle text-${appointmentStatusTone(item.status)}`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                      <td>{formatDay(item.appointmentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </Col>
  );
};

export default RecentOrders;
