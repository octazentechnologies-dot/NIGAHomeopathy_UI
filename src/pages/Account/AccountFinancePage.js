import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import { Link } from "react-router-dom";
import {
  approvePayout,
  createRefund,
  createSettlement,
  getClinicCollections,
  getLedger,
  getMedicineLedger,
  getReconciliation,
  getTaxReport,
  earningsSummary,
  listExceptions,
  listPayees,
  listPayouts,
  listRefunds,
  listSettlements,
  rejectPayout,
  requestPayoutOtp,
  resolveException,
  retryException,
  s4Message,
  settlementDetail,
  unwrapS4,
} from "../../helpers/s4Week4Api";
import "./components/accountDashboard.css";

const SECTIONS = {
  ledger: { title: "Ledger", subtitle: "Every rupee that moves through the platform." },
  "doctor-earnings": { title: "Doctor earnings", subtitle: "Consultation reconciliation by visit." },
  payouts: { title: "Payouts", subtitle: "OTP-approved releases to doctors and pharmacies." },
  invoices: { title: "Refunds", subtitle: "Refunds against original payment orders." },
  reports: { title: "Reports", subtitle: "Tax, collections, medicine ledger, settlements, exceptions, payees." },
  "clinic-collections": { title: "Clinic collections", subtitle: "Cash and UPI collected at reception." },
  settlements: { title: "Settlements", subtitle: "Dry-run and commit settlement runs." },
  exceptions: { title: "Payment exceptions", subtitle: "Failed or disputed payments to resolve." },
  tax: { title: "GST & tax", subtitle: "Invoice tax report for the selected dates." },
  payees: { title: "Payees", subtitle: "Bank and KYC records for doctors and pharmacies." },
  "medicine-ledger": { title: "Medicine ledger", subtitle: "Medicine money tracked separately from consultations." },
  "consult-recon": { title: "Consultation reconciliation", subtitle: "Online and reception collections matched to visits." },
  refunds: { title: "Refunds", subtitle: "Refunds against original payment orders." },
};

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const asRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.payouts)) return payload.payouts;
  if (Array.isArray(payload?.exceptions)) return payload.exceptions;
  if (Array.isArray(payload?.settlements)) return payload.settlements;
  if (Array.isArray(payload?.refunds)) return payload.refunds;
  if (Array.isArray(payload?.payees)) return payload.payees;
  if (Array.isArray(payload?.collections)) return payload.collections;
  return [];
};

const AccountFinancePage = ({ section = "ledger" }) => {
  const meta = SECTIONS[section] || SECTIONS.ledger;
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [otpById, setOtpById] = useState({});
  const [refundForm, setRefundForm] = useState({ paymentOrderId: "", amount: "", reason: "" });

  document.title = `${meta.title} | Niga Homeocentrum`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      switch (section) {
        case "ledger":
          response = await getLedger({ page: 1 });
          break;
        case "doctor-earnings":
          response = await earningsSummary({});
          break;
        case "consult-recon":
          response = await getReconciliation({});
          break;
        case "medicine-ledger":
          response = await getMedicineLedger({});
          break;
        case "payouts":
          response = await listPayouts();
          break;
        case "invoices":
        case "refunds":
          response = await listRefunds();
          break;
        case "clinic-collections":
          response = await getClinicCollections({});
          break;
        case "settlements":
          response = await listSettlements();
          break;
        case "exceptions":
          response = await listExceptions("OPEN");
          break;
        case "tax":
          response = await getTaxReport({});
          break;
        case "payees":
          response = await listPayees();
          break;
        case "reports":
          response = await getClinicCollections({});
          break;
        default:
          response = await getLedger({ page: 1 });
      }
      const data = unwrapS4(response);
      if (section === "doctor-earnings") {
        const summary = data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : data;
        setDetail(summary && !Array.isArray(summary) ? summary : null);
        setRows(asRows(summary?.recent ?? summary?.Recent));
      } else {
        setRows(asRows(data?.data ?? data ?? response));
        setDetail(data && !Array.isArray(data) ? data : null);
      }
    } catch (err) {
      setRows([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).slice(0, 8);
  }, [rows]);

  const runPayoutOtp = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const response = await requestPayoutOtp(id);
      setNote(unwrapS4(response)?.message || response?.message || "OTP sent for this payout.");
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runApprove = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await approvePayout(id, { otp: otpById[id] || "" });
      setNote("Payout approved.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runReject = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await rejectPayout(id, { reason: "Rejected from Account screen" });
      setNote("Payout rejected.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runSettlement = async (confirm) => {
    setBusyId("settle");
    setError("");
    try {
      const response = await createSettlement({ dryRun: !confirm, confirm: Boolean(confirm) });
      setNote(unwrapS4(response)?.message || response?.message || (confirm ? "Settlement committed." : "Dry-run ready."));
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runRefund = async () => {
    setBusyId("refund");
    setError("");
    try {
      await createRefund({
        paymentOrderId: Number(refundForm.paymentOrderId),
        amount: refundForm.amount ? Number(refundForm.amount) : undefined,
        reason: refundForm.reason.trim(),
      });
      setNote("Refund recorded.");
      setRefundForm({ paymentOrderId: "", amount: "", reason: "" });
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const openSettlement = async (id) => {
    setBusyId(id);
    try {
      const response = await settlementDetail(id);
      setDetail(unwrapS4(response));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-content admin-dashboard-page account-dashboard-page">
      <Container fluid>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h2 className="account-page-title">{meta.title}</h2>
            <p className="account-page-subtitle mb-0">{meta.subtitle}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/accountdashboard" className="btn btn-sm btn-soft-secondary">
              Account home
            </Link>
            <Button size="sm" className="account-primary-btn" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}

        {section === "doctor-earnings" && detail && !loading ? (
          <Row className="g-3 mb-3">
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Visits</div><div className="fs-4">{detail.visitCount ?? 0}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Total</div><div className="fs-4">{money(detail.totalCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Online</div><div className="fs-4">{money(detail.onlineCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">At clinic</div><div className="fs-4">{money(detail.clinicCollected)}</div></CardBody></Card></Col>
          </Row>
        ) : null}

        {(section === "settlements" || section === "reports") ? (
          <Card className="admin-dash-card mb-3">
            <CardBody className="d-flex flex-wrap gap-2">
              <Button
                size="sm"
                color="soft-primary"
                disabled={busyId === "settle"}
                onClick={() => runSettlement(false)}
              >
                Dry-run settlement
              </Button>
              <Button
                size="sm"
                className="account-primary-btn"
                disabled={busyId === "settle"}
                onClick={() => runSettlement(true)}
              >
                Commit settlement
              </Button>
            </CardBody>
          </Card>
        ) : null}

        {(section === "refunds" || section === "invoices") ? (
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <h5 className="mb-3">Create refund</h5>
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Label>Payment order id</Label>
                  <Input
                    value={refundForm.paymentOrderId}
                    onChange={(e) => setRefundForm({ ...refundForm, paymentOrderId: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  />
                </Col>
                <Col md={5}>
                  <Label>Reason</Label>
                  <Input
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Button className="account-primary-btn w-100" disabled={busyId === "refund"} onClick={runRefund}>
                    Save refund
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ) : null}

        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="text-center py-4">
                <Spinner size="sm" /> Loading…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted mb-0">
                {section === "doctor-earnings" ? "Summary loaded above. Line items appear when visits have captures." : "No rows yet for this screen."}
              </p>
            ) : (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0" size="sm">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                      {section === "payouts" || section === "exceptions" || section === "settlements" ? (
                        <th>Actions</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const id = row.payoutId || row.PayoutId || row.paymentExceptionId || row.PaymentExceptionId
                        || row.settlementRunId || row.SettlementRunId || row.id || row.Id || index;
                      return (
                        <tr key={`${id}-${index}`}>
                          {columns.map((col) => {
                            const value = row[col];
                            const text = /amount|fee|gst|commission|total/i.test(col)
                              ? money(value)
                              : String(value ?? "—");
                            return <td key={col}>{text}</td>;
                          })}
                          {section === "payouts" ? (
                            <td style={{ minWidth: 220 }}>
                              <div className="d-flex flex-wrap gap-1 align-items-center">
                                <Button size="sm" color="soft-secondary" disabled={busyId === id} onClick={() => runPayoutOtp(id)}>
                                  OTP
                                </Button>
                                <Input
                                  bsSize="sm"
                                  style={{ width: 90 }}
                                  placeholder="OTP"
                                  value={otpById[id] || ""}
                                  onChange={(e) => setOtpById({ ...otpById, [id]: e.target.value })}
                                />
                                <Button size="sm" color="soft-success" disabled={busyId === id} onClick={() => runApprove(id)}>
                                  Approve
                                </Button>
                                <Button size="sm" color="soft-danger" disabled={busyId === id} onClick={() => runReject(id)}>
                                  Reject
                                </Button>
                              </div>
                            </td>
                          ) : null}
                          {section === "exceptions" ? (
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  color="soft-primary"
                                  disabled={busyId === id}
                                  onClick={async () => {
                                    setBusyId(id);
                                    try {
                                      await retryException(id);
                                      setNote("Retry queued.");
                                      await load();
                                    } catch (err) {
                                      setError(s4Message(err));
                                    } finally {
                                      setBusyId(null);
                                    }
                                  }}
                                >
                                  Retry
                                </Button>
                                <Button
                                  size="sm"
                                  color="soft-success"
                                  disabled={busyId === id}
                                  onClick={async () => {
                                    setBusyId(id);
                                    try {
                                      await resolveException(id, { note: "Resolved from Account screen" });
                                      setNote("Exception resolved.");
                                      await load();
                                    } catch (err) {
                                      setError(s4Message(err));
                                    } finally {
                                      setBusyId(null);
                                    }
                                  }}
                                >
                                  Resolve
                                </Button>
                              </div>
                            </td>
                          ) : null}
                          {section === "settlements" ? (
                            <td>
                              <Button size="sm" color="soft-info" disabled={busyId === id} onClick={() => openSettlement(id)}>
                                Detail
                              </Button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
            {detail && section === "settlements" ? (
              <pre className="small bg-light border rounded p-2 mt-3 mb-0" style={{ maxHeight: 220, overflow: "auto" }}>
                {JSON.stringify(detail, null, 2)}
              </pre>
            ) : null}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AccountFinancePage;
