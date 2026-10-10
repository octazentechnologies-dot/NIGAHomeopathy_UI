import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Col, Container, Row, Spinner, Table } from "reactstrap";
import { earningsSummary, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";
import { earningsBuckets } from "../../../helpers/s5Week5Api";

/** DMO-10.02 web surface for doctor earnings summary (same API as mobile). */
const DoctorEarningsSummaryPage = () => {
  const [data, setData] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && navigator.onLine === false);

  document.title = "Earnings | Niga Homeocentrum";

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await earningsSummary({});
        const bucketResponse = await earningsBuckets({});
        if (!cancelled) {
          setData(unwrapS4(response));
          const bucketRows = unwrapS4(bucketResponse);
          setBuckets(Array.isArray(bucketRows) ? bucketRows : []);
        }
      } catch (err) {
        if (!cancelled) setError(s4Message(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Earnings summary</h2>
        <p className="clinic-page-subtitle">Consult captures and clinic collections for this doctor (API).</p>
        {offline ? <Alert color="warning">You appear to be offline. Earnings will load when the connection returns.</Alert> : null}
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? (
          <div className="py-4"><Spinner size="sm" /> Loading…</div>
        ) : data ? (
          <Row className="g-3">
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Visits</div><div className="fs-4">{data.visitCount ?? 0}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Total</div><div className="fs-4">{money(data.totalCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Online</div><div className="fs-4">{money(data.onlineCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">At clinic</div><div className="fs-4">{money(data.clinicCollected)}</div></CardBody></Card></Col>
            <Col md={12}>
              <Card className="admin-dash-card">
                <CardBody>
                  <div className="text-muted small mb-1">Pending payout</div>
                  <div className="fs-5">{money(data.pendingPayoutAmount)}</div>
                </CardBody>
              </Card>
            </Col>
            <Col md={12}>
              <Card className="admin-dash-card">
                <CardBody>
                  <div className="text-muted small mb-2">Monthly buckets</div>
                  {buckets.length === 0 ? <div className="text-muted">No paid months in this window.</div> : (
                    <Table size="sm" className="mb-0">
                      <thead><tr><th>Month</th><th>Orders</th><th>Amount</th></tr></thead>
                      <tbody>
                        {buckets.map((row) => (
                          <tr key={row.bucket || row.Bucket}>
                            <td>{row.bucket || row.Bucket}</td>
                            <td>{row.cnt ?? row.Cnt}</td>
                            <td>{money(row.amount ?? row.Amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
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
