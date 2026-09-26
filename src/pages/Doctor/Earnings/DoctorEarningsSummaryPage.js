import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";
import { earningsSummary, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";

/** DMO-10.02 web surface for doctor earnings summary (same API as mobile). */
const DoctorEarningsSummaryPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  document.title = "Earnings | Niga Homeocentrum";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await earningsSummary({});
        if (!cancelled) setData(unwrapS4(response));
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

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Earnings summary</h4>
        <p className="text-muted">Consult captures and clinic collections for this doctor (New API).</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? (
          <div className="py-4"><Spinner size="sm" /> Loading…</div>
        ) : data ? (
          <Row className="g-3">
            <Col md={3}><Card><CardBody><div className="text-muted small">Visits</div><div className="fs-4">{data.visitCount ?? 0}</div></CardBody></Card></Col>
            <Col md={3}><Card><CardBody><div className="text-muted small">Total</div><div className="fs-4">{money(data.totalCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card><CardBody><div className="text-muted small">Online</div><div className="fs-4">{money(data.onlineCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card><CardBody><div className="text-muted small">At clinic</div><div className="fs-4">{money(data.clinicCollected)}</div></CardBody></Card></Col>
            <Col md={12}>
              <Card>
                <CardBody>
                  <div className="text-muted small mb-1">Pending payout</div>
                  <div className="fs-5">{money(data.pendingPayoutAmount)}</div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        ) : null}
      </Container>
    </div>
  );
};

export default DoctorEarningsSummaryPage;
