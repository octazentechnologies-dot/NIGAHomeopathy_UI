import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Container, Spinner, Table } from "reactstrap";
import { getAuthDoctorId } from "../../../helpers/appointmentSlotHelper";
import { getDoctorWaitlist } from "../../../helpers/realbackend_helper";

const unwrap = (response) => {
  const body = response?.data ?? response;
  const data = body?.data ?? body?.Data ?? body;
  return Array.isArray(data) ? data : [];
};

const DoctorWaitlistPage = () => {
  const doctorId = Number(getAuthDoctorId() || 0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  document.title = "Waitlist | Niga Homeocentrum";

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      setError("Doctor id is missing.");
      return undefined;
    }
    getDoctorWaitlist(doctorId)
      .then((response) => setRows(unwrap(response)))
      .catch((err) => setError(err?.message || "Could not load waitlist."))
      .finally(() => setLoading(false));
    return undefined;
  }, [doctorId]);

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Waitlist</h2>
            <p className="clinic-page-subtitle mb-0">Patients waiting for an offered slot. Joining does not reserve time.</p>
          </div>
        </div>
        {error ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}
        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="py-3 text-muted"><Spinner size="sm" className="me-2" /> Loading…</div>
            ) : (
              <Table responsive className="table-nowrap align-middle mb-0 clinic-data-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-muted py-4">No waitlist entries.</td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.bookingWaitlistId || row.BookingWaitlistId}>
                        <td>{row.bookingWaitlistId || row.BookingWaitlistId}</td>
                        <td className="fw-medium">{row.contactName || row.ContactName}</td>
                        <td>{row.contactMobile || row.ContactMobile}</td>
                        <td>{row.requestedDate || row.RequestedDate}</td>
                        <td>{row.status || row.Status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default DoctorWaitlistPage;
