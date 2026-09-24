import React, { useEffect, useState } from "react";
import { Card, CardBody, Col, Container, Row, Spinner, Badge, Input } from "reactstrap";
import { getEnquiries } from "../../helpers/realbackend_helper";

const EnquiryInboxPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    document.title = "Enquiries | Homeocentrum";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getEnquiries(status ? { status } : null)
      .then((payload) => {
        if (cancelled) return;
        const list = payload?.data ?? payload?.Data ?? (Array.isArray(payload) ? payload : []);
        setRows(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(typeof err === "string" ? err : err?.message || "Could not load enquiries.");
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="page-content">
      <Container fluid>
        <Row className="mb-3 align-items-center">
          <Col>
            <h4 className="mb-1">Enquiry inbox</h4>
            <p className="text-muted mb-0">Messages sent from the website.</p>
          </Col>
          <Col md={3}>
            <Input type="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
              <option value="">All statuses</option>
              <option value="New">New</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </Input>
          </Col>
        </Row>
        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="primary" />
              </div>
            ) : error ? (
              <p className="text-danger mb-0">{error}</p>
            ) : rows.length === 0 ? (
              <p className="text-muted mb-0">No enquiries found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Details</th>
                      <th>Ticket</th>
                      <th>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.enquiryId ?? row.EnquiryId}>
                        <td>{row.enquiryId ?? row.EnquiryId}</td>
                        <td>{row.enquiryName ?? row.EnquiryName}</td>
                        <td>{row.enquiryDate ?? row.EnquiryDate}</td>
                        <td>{row.emailId ?? row.EmailId}</td>
                        <td>{row.mobileNo ?? row.MobileNo}</td>
                        <td>{row.enquiryDetails ?? row.EnquiryDetails}</td>
                        <td>
                          <Badge color="info">{row.ticketStatus ?? row.TicketStatus ?? "New"}</Badge>
                        </td>
                        <td>{row.assignedTo ?? row.AssignedTo ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default EnquiryInboxPage;
