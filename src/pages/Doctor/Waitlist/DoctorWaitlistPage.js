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
    <div className="page-content">
      <Container fluid>
        <h4>Waitlist</h4>
        <p className="text-muted">Patients waiting for an offered slot. Joining does not reserve time.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        <Card>
          <CardBody>
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <Table responsive>
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
                  {rows.map((row) => (
                    <tr key={row.bookingWaitlistId || row.BookingWaitlistId}>
                      <td>{row.bookingWaitlistId || row.BookingWaitlistId}</td>
                      <td>{row.contactName || row.ContactName}</td>
                      <td>{row.contactMobile || row.ContactMobile}</td>
                      <td>{row.requestedDate || row.RequestedDate}</td>
                      <td>{row.status || row.Status}</td>
                    </tr>
                  ))}
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
