import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import { Link } from "react-router-dom";
import {
  approvePayout,
  createRefund,
  createSettlement,
  getClinicCollections,
  exportLedger,
  getLedger,
  getMedicineLedger,
  getReconciliation,
  getTaxReport,
  earningsSummary,
  listExceptions,
  listPayees,
  updatePayee,
  requestPayeeBankOtp,
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
import {
  downloadCsvEnvelope,
  exportPayouts,
  exportReconciliation,
  exportSettlements,
} from "../../helpers/s5Week5Api";
import "./components/accountDashboard.css";

const SECTIONS = {
  ledger: { title: "Ledger", subtitle: "Every rupee that moves through the platform." },
  "doctor-earnings": { title: "Doctor earnings", subtitle: "Consultation reconciliation by visit." },
  payouts: { title: "Payouts", subtitle: "OTP-approved releases to doctors and pharmacies." },
  invoices: { title: "Refunds", subtitle: "Refunds against original payment orders." },
  reports: { title: "Reports", subtitle: "Tax, collections, medicine ledger, settlements, exceptions, payees." },
  "clinic-collections": { title: "Clinic collections", subtitle: "Cash and UPI collected at reception." },
  settlements: { title: "Settlements", subtitle: "Group collected rupees into a run, then create PENDING payouts for doctors or pharmacies." },
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
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.Orders)) return payload.Orders;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.payouts)) return payload.payouts;
  if (Array.isArray(payload?.exceptions)) return payload.exceptions;
  if (Array.isArray(payload?.settlements)) return payload.settlements;
  if (Array.isArray(payload?.refunds)) return payload.refunds;
  if (Array.isArray(payload?.payees)) return payload.payees;
  if (Array.isArray(payload?.collections)) return payload.collections;
  return [];
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const formatWhen = (value) => {
  if (value == null || value === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isClinicCollection = (row) => {
  const method = String(pick(row, "method", "Method") || "").toUpperCase();
  const status = String(pick(row, "status", "Status") || "").toUpperCase();
  if (["CASH", "UPI_OFFLINE", "CARD_POS", "PAY_AT_CLINIC", "PAY_LINK"].includes(method)) return true;
  if (status === "COLLECTED") return true;
  return false;
};

const channelLabel = (row) => {
  const method = String(pick(row, "method", "Method") || "").toUpperCase();
  if (method === "CASH") return "Clinic · Cash";
  if (method === "UPI_OFFLINE") return "Clinic · UPI";
  if (method === "CARD_POS") return "Clinic · Card POS";
  if (method === "PAY_LINK") return "Clinic · Pay link";
  if (method === "PAY_AT_CLINIC") return "Clinic";
  if (isClinicCollection(row)) return "Clinic collection";
  if (method) return `Online · ${method}`;
  return "Online";
};

const maskBank = (value) => {
  const digits = String(value || "").replace(/\s/g, "");
  if (!digits) return "—";
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
};

const LedgerLinesTable = ({ rows }) => (
  <div className="table-responsive">
    <Table className="table-nowrap align-middle mb-0" size="sm">
      <thead>
        <tr>
          <th>When</th>
          <th>Stream</th>
          <th>Direction</th>
          <th>Amount</th>
          <th>GST</th>
          <th>Type</th>
          <th>Reference</th>
          <th>Order</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${pick(row, "ledgerEntryId", "LedgerEntryId") || index}`}>
            <td>{formatWhen(pick(row, "at", "At", "createdAt", "CreatedAt"))}</td>
            <td>{pick(row, "stream", "Stream") || "—"}</td>
            <td>{pick(row, "direction", "Direction") || "—"}</td>
            <td>{money(pick(row, "amount", "Amount"))}</td>
            <td>{money(pick(row, "gst", "Gst"))}</td>
            <td>{pick(row, "entityType", "EntityType") || "—"}</td>
            <td>{pick(row, "entityId", "EntityId") || "—"}</td>
            <td>{pick(row, "paymentOrderId", "PaymentOrderId") || "—"}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

const OrderLinesTable = ({ rows, rowKey = "ord" }) => (
  <div className="table-responsive">
    <Table className="table-nowrap align-middle mb-0" size="sm">
      <thead>
        <tr>
          <th>When</th>
          <th>Order</th>
          <th>Visit</th>
          <th>Patient</th>
          <th>Doctor</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Channel</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${rowKey}-${pick(row, "paymentOrderId", "PaymentOrderId") || index}`}>
            <td>{formatWhen(pick(row, "createdAt", "CreatedAt", "at", "At"))}</td>
            <td>{pick(row, "paymentOrderId", "PaymentOrderId") || "—"}</td>
            <td>{pick(row, "patientAppId", "PatientAppId") || "—"}</td>
            <td>{pick(row, "patientId", "PatientId") || "—"}</td>
            <td>{pick(row, "doctorId", "DoctorId") || "—"}</td>
            <td>{money(pick(row, "amount", "Amount"))}</td>
            <td>{pick(row, "status", "Status") || "—"}</td>
            <td>{channelLabel(row)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

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
  const [taxFrom, setTaxFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [taxTo, setTaxTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [ledgerFrom, setLedgerFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [ledgerTo, setLedgerTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [ledgerStream, setLedgerStream] = useState("");
  const [clinicFrom, setClinicFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [clinicTo, setClinicTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [payeeEdit, setPayeeEdit] = useState({
    payeeId: "",
    accountName: "",
    bankAccount: "",
    ifsc: "",
    pan: "",
    otp: "",
  });

  document.title = `${meta.title} | Niga Homeocentrum`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      switch (section) {
        case "ledger":
          response = await getLedger({
            page: 1,
            from: ledgerFrom,
            to: ledgerTo,
            stream: ledgerStream || undefined,
          });
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
          response = await getClinicCollections({ from: clinicFrom, to: clinicTo });
          break;
        case "settlements":
          response = await listSettlements();
          break;
        case "exceptions":
          response = await listExceptions("OPEN");
          break;
        case "tax":
          response = await getTaxReport({ from: taxFrom, to: taxTo });
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
      if (section === "tax") {
        const envelope = !response || Array.isArray(response)
          ? {}
          : (response.gstRate != null || response.GstRate != null || response.csv || response.Csv
            ? response
            : (response.data && typeof response.data === "object" && !Array.isArray(response.data) ? response.data : response));
        setDetail({
          gstRate: envelope.gstRate ?? envelope.GstRate ?? 0,
          treatmentExempt: envelope.treatmentExempt ?? envelope.TreatmentExempt ?? true,
          gstTotal: envelope.gstTotal ?? envelope.GstTotal ?? 0,
          csv: envelope.csv ?? envelope.Csv ?? "",
          fileName: envelope.fileName ?? envelope.FileName ?? "tax.csv",
        });
        setRows(asRows(envelope.data ?? data));
      } else if (section === "doctor-earnings") {
        const summary = data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : data;
        setDetail(summary && !Array.isArray(summary) ? summary : null);
        setRows(asRows(summary?.recent ?? summary?.Recent));
      } else if (section === "clinic-collections") {
        const envelope = response && !Array.isArray(response) ? response : {};
        setDetail({
          total: envelope.total ?? envelope.Total ?? 0,
          cash: envelope.cash ?? envelope.Cash ?? 0,
          upi: envelope.upi ?? envelope.Upi ?? 0,
          card: envelope.card ?? envelope.Card ?? 0,
          payLink: envelope.payLink ?? envelope.PayLink ?? 0,
          count: envelope.count ?? envelope.Count,
        });
        setRows(asRows(envelope.data ?? data ?? response));
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
  }, [section, taxFrom, taxTo, ledgerFrom, ledgerTo, ledgerStream, clinicFrom, clinicTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setNote("");
    setError("");
    setDetail(null);
  }, [section]);

  const clinicOrders = useMemo(() => rows.filter(isClinicCollection), [rows]);
  const onlineOrders = useMemo(() => rows.filter((row) => !isClinicCollection(row)), [rows]);
  const sumAmount = (list) => list.reduce((acc, row) => acc + (Number(pick(row, "amount", "Amount")) || 0), 0);

  const runLedgerExport = async () => {
    setBusyId("ledger-export");
    setError("");
    try {
      const response = await exportLedger({
        from: ledgerFrom,
        to: ledgerTo,
        stream: ledgerStream || undefined,
      });
      const envelope = unwrapS4(response) || response;
      const csv = envelope.csv || envelope.Csv || "";
      if (!csv) {
        setError("No CSV returned for this date range.");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = envelope.fileName || envelope.FileName || "ledger.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runPayoutOtp = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const response = await requestPayoutOtp(id);
      const body = unwrapS4(response) || response || {};
      const code = body.devCode || body.DevCode || body.data?.devCode;
      if (code) {
        setOtpById((current) => ({ ...current, [id]: String(code) }));
        setNote(`OTP for this payout (dev): ${code}. Click Approve to release. Bank/RazorpayX stays skipped until keys exist.`);
      } else {
        setNote(body.message || response?.message || "OTP sent. Enter the 6-digit code, then Approve.");
      }
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runApprove = async (id) => {
    const otp = String(otpById[id] || "").trim();
    if (!/^\d{6}$/.test(otp)) {
      setBusyId(null);
      setError("Click OTP first, then Approve with the 6-digit code (exactly 6 numbers).");
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await approvePayout(id, { otp });
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
      const body = unwrapS4(response) || response || {};
      const lines = body.lineCount ?? body.LineCount ?? body.data?.length ?? 0;
      const amount = body.amount ?? body.Amount;
      if (!confirm) {
        setNote(`Dry-run: ${lines} unsettled credit line(s)${amount != null ? `, ${money(amount)}` : ""}. Commit only if this matches what you expect.`);
      } else {
        setNote(`Settlement committed. ${lines} PENDING payout(s) created. Open Payouts, click OTP, then Approve with the 6-digit code.`);
      }
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
    const orderId = Number(refundForm.paymentOrderId);
    const amount = refundForm.amount === "" ? undefined : Number(refundForm.amount);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setBusyId(null);
      setError("Enter a valid payment order id.");
      return;
    }
    if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
      setBusyId(null);
      setError("Refund amount must be greater than 0.");
      return;
    }
    if (!refundForm.reason.trim()) {
      setBusyId(null);
      setError("Refund reason is required.");
      return;
    }
    try {
      await createRefund({
        paymentOrderId: orderId,
        amount,
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

  const startPayeeEdit = (row) => {
    const id = pick(row, "payeeId", "PayeeId");
    setPayeeEdit({
      payeeId: id ? String(id) : "",
      accountName: pick(row, "accountName", "AccountName") || "",
      bankAccount: pick(row, "bankAccount", "BankAccount") || "",
      ifsc: pick(row, "ifsc", "Ifsc") || "",
      pan: pick(row, "pan", "Pan") || "",
      otp: "",
    });
  };

  const runPayeeOtp = async () => {
    const id = Number(payeeEdit.payeeId);
    if (!id) {
      setError("Select a payee row first.");
      return;
    }
    setBusyId("payee-otp");
    setError("");
    try {
      const response = await requestPayeeBankOtp(id);
      const body = unwrapS4(response) || response;
      const code = body?.devCode || body?.DevCode || "";
      if (code) setPayeeEdit((current) => ({ ...current, otp: String(code) }));
      setNote(body?.message || response?.message || (code ? `OTP filled: ${code}` : "OTP sent for the bank change."));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const savePayee = async () => {
    const id = Number(payeeEdit.payeeId);
    if (!id) {
      setError("Select a payee row first.");
      return;
    }
    if (payeeEdit.pan && String(payeeEdit.pan).trim() && String(payeeEdit.pan).trim().length !== 10) {
      setError("PAN must be 10 characters.");
      return;
    }
    setBusyId("payee-save");
    setError("");
    try {
      await updatePayee(id, {
        accountName: payeeEdit.accountName.trim() || null,
        bankAccount: payeeEdit.bankAccount.trim() || null,
        ifsc: payeeEdit.ifsc.trim() || null,
        pan: payeeEdit.pan.trim() || null,
        otp: payeeEdit.otp.trim() || null,
      });
      setNote("Payee bank / KYC saved.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const exportClinicCsv = () => {
    const header = "When,Order,Visit,Patient,Doctor,Amount,Status,Channel";
    const lines = rows.map((row) =>
      [
        formatWhen(pick(row, "createdAt", "CreatedAt")),
        pick(row, "paymentOrderId", "PaymentOrderId") || "",
        pick(row, "patientAppId", "PatientAppId") || "",
        pick(row, "patientId", "PatientId") || "",
        pick(row, "doctorId", "DoctorId") || "",
        pick(row, "amount", "Amount") || "",
        pick(row, "status", "Status") || "",
        channelLabel(row),
      ].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clinic-collections.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openSettlement = async (id) => {
    setBusyId(id);
    try {
      const response = await settlementDetail(id);
      const body = unwrapS4(response) || response;
      const packed = body?.run || body?.Run ? body : (body?.data || body);
      setDetail(packed);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runReportExport = async (call, fallbackName) => {
    setError("");
    try {
      const response = await call();
      const envelope = response?.csv || response?.Csv ? response : (response?.data || response);
      if (!downloadCsvEnvelope(envelope, fallbackName)) {
        setError("The export did not include a CSV file.");
      }
    } catch (err) {
      setError(s4Message(err));
    }
  };

  return (
    <div className="page-content admin-dashboard-page account-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h2 className="clinic-page-title account-page-title">{meta.title}</h2>
            <p className="clinic-page-subtitle account-page-subtitle mb-0">{meta.subtitle}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/accountdashboard" className="btn btn-sm btn-soft-secondary">
              Account home
            </Link>
            <Button size="sm" className="account-primary-btn" onClick={load} disabled={loading}>
              Refresh
            </Button>
            {section === "consult-recon" || section === "reports" ? (
              <Button size="sm" color="soft-secondary" onClick={() => runReportExport(exportReconciliation, "reconciliation.csv")}>
                Export reconciliation
              </Button>
            ) : null}
            {section === "settlements" || section === "reports" ? (
              <Button size="sm" color="soft-secondary" onClick={() => runReportExport(exportSettlements, "settlements.csv")}>
                Export settlements
              </Button>
            ) : null}
            {section === "payouts" || section === "reports" ? (
              <Button size="sm" color="soft-secondary" onClick={() => runReportExport(exportPayouts, "payouts.csv")}>
                Export payouts
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}

        {section === "tax" ? (
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Label>From</Label>
                  <Input type="date" value={taxFrom} onChange={(e) => setTaxFrom(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Label>To</Label>
                  <Input type="date" value={taxTo} onChange={(e) => setTaxTo(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Button className="account-primary-btn" onClick={load} disabled={loading}>Load report</Button>
                </Col>
                <Col md={3}>
                  <Button
                    color="soft-secondary"
                    disabled={!detail?.csv}
                    onClick={() => {
                      const blob = new Blob([detail.csv], { type: "text/csv;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = detail.fileName || "tax.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export CSV
                  </Button>
                </Col>
              </Row>
              {detail && !loading ? (
                <Row className="g-3 mt-2">
                  <Col md={4}><div className="text-muted small">GST rate</div><div className="fs-5">{detail.gstRate ?? 0}%</div></Col>
                  <Col md={4}><div className="text-muted small">Treatment exempt</div><div className="fs-5">{detail.treatmentExempt ? "Yes" : "No"}</div></Col>
                  <Col md={4}><div className="text-muted small">GST total</div><div className="fs-5">{money(detail.gstTotal)}</div></Col>
                </Row>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        {section === "doctor-earnings" && detail && !loading ? (
          <Row className="g-3 mb-3">
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Visits</div><div className="fs-4">{detail.visitCount ?? 0}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Total</div><div className="fs-4">{money(detail.totalCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">Online</div><div className="fs-4">{money(detail.onlineCaptured)}</div></CardBody></Card></Col>
            <Col md={3}><Card className="admin-dash-card"><CardBody><div className="text-muted small">At clinic</div><div className="fs-4">{money(detail.clinicCollected)}</div></CardBody></Card></Col>
          </Row>
        ) : null}

        {section === "ledger" ? (
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Label>From</Label>
                  <Input type="date" value={ledgerFrom} onChange={(e) => setLedgerFrom(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Label>To</Label>
                  <Input type="date" value={ledgerTo} onChange={(e) => setLedgerTo(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Label>Stream</Label>
                  <Input type="select" value={ledgerStream} onChange={(e) => setLedgerStream(e.target.value)}>
                    <option value="">All streams</option>
                    <option value="CONSULT">Consult</option>
                    <option value="MEDICINE">Medicine</option>
                    <option value="SUBSCRIPTION">Subscription</option>
                  </Input>
                </Col>
                <Col md={3} className="d-flex gap-2">
                  <Button className="account-primary-btn" onClick={load} disabled={loading}>Apply</Button>
                  <Button color="soft-secondary" disabled={busyId === "ledger-export"} onClick={runLedgerExport}>
                    Export CSV
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ) : null}

        {section === "consult-recon" && !loading ? (
          <Row className="g-3 mb-3">
            <Col md={4}>
              <Card className="admin-dash-card"><CardBody>
                <div className="text-muted small">All consult orders</div>
                <div className="fs-4">{rows.length}</div>
                <div className="small">{money(sumAmount(rows))}</div>
              </CardBody></Card>
            </Col>
            <Col md={4}>
              <Card className="admin-dash-card"><CardBody>
                <div className="text-muted small">Online collections</div>
                <div className="fs-4">{onlineOrders.length}</div>
                <div className="small">{money(sumAmount(onlineOrders))}</div>
              </CardBody></Card>
            </Col>
            <Col md={4}>
              <Card className="admin-dash-card"><CardBody>
                <div className="text-muted small">Clinic collections</div>
                <div className="fs-4">{clinicOrders.length}</div>
                <div className="small">{money(sumAmount(clinicOrders))}</div>
              </CardBody></Card>
            </Col>
          </Row>
        ) : null}

        {section === "clinic-collections" ? (
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <p className="mb-2">
                Reception cash, offline UPI, card POS, and pay-link collections — not Razorpay online captures.
              </p>
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Label>From</Label>
                  <Input type="date" value={clinicFrom} onChange={(e) => setClinicFrom(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Label>To</Label>
                  <Input type="date" value={clinicTo} onChange={(e) => setClinicTo(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Button className="account-primary-btn" onClick={load} disabled={loading}>Apply dates</Button>
                </Col>
                <Col md={3}>
                  <Button color="soft-secondary" disabled={!rows.length} onClick={exportClinicCsv}>Export CSV</Button>
                </Col>
              </Row>
              {detail && !loading ? (
                <Row className="g-3 mt-2">
                  <Col md={2}><div className="text-muted small">Rows</div><div className="fs-5">{detail.count ?? rows.length}</div></Col>
                  <Col md={2}><div className="text-muted small">Total</div><div className="fs-5">{money(detail.total ?? sumAmount(rows))}</div></Col>
                  <Col md={2}><div className="text-muted small">Cash</div><div className="fs-5">{money(detail.cash)}</div></Col>
                  <Col md={2}><div className="text-muted small">UPI</div><div className="fs-5">{money(detail.upi)}</div></Col>
                  <Col md={2}><div className="text-muted small">Card POS</div><div className="fs-5">{money(detail.card)}</div></Col>
                  <Col md={2}><div className="text-muted small">Pay link</div><div className="fs-5">{money(detail.payLink)}</div></Col>
                </Row>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        {section === "payees" ? (
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <p className="mb-2">
                Click <strong>Edit</strong> on a row. Account name, IFSC, and PAN save directly. Changing the bank account needs a 6-digit OTP (Dev fills the code).
              </p>
              <Row className="g-2 align-items-end">
                <Col md={2}>
                  <Label>Payee id</Label>
                  <Input value={payeeEdit.payeeId} disabled />
                </Col>
                <Col md={3}>
                  <Label>Account name</Label>
                  <Input
                    value={payeeEdit.accountName}
                    onChange={(e) => setPayeeEdit({ ...payeeEdit, accountName: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Label>Bank account</Label>
                  <Input
                    value={payeeEdit.bankAccount}
                    onChange={(e) => setPayeeEdit({ ...payeeEdit, bankAccount: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Label>IFSC</Label>
                  <Input
                    value={payeeEdit.ifsc}
                    onChange={(e) => setPayeeEdit({ ...payeeEdit, ifsc: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Label>PAN</Label>
                  <Input
                    maxLength={10}
                    value={payeeEdit.pan}
                    onChange={(e) => setPayeeEdit({ ...payeeEdit, pan: e.target.value })}
                  />
                </Col>
                <Col md={1}>
                  <Label>OTP</Label>
                  <Input
                    maxLength={6}
                    value={payeeEdit.otp}
                    onChange={(e) => setPayeeEdit({ ...payeeEdit, otp: e.target.value })}
                  />
                </Col>
              </Row>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Button size="sm" color="soft-secondary" disabled={busyId === "payee-otp" || !payeeEdit.payeeId} onClick={runPayeeOtp}>
                  OTP for bank change
                </Button>
                <Button size="sm" className="account-primary-btn" disabled={busyId === "payee-save" || !payeeEdit.payeeId} onClick={savePayee}>
                  Save payee
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {(section === "settlements" || section === "reports") ? (
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <p className="mb-2">
                Settlement is the Account step that says: these collected rupees are ready to pay out.
                It does not send money to a bank. It groups unsettled ledger credits and creates <strong>PENDING payouts</strong>.
              </p>
              <ol className="small text-muted mb-3 ps-3">
                <li>Money hits the ledger when reception collects or a gateway capture succeeds.</li>
                <li><strong>Dry-run</strong> counts those unsettled lines. Use this in a demo.</li>
                <li><strong>Commit</strong> locks those lines into a settlement run and opens rows on Payouts.</li>
                <li>On <Link to="/account/payouts">Payouts</Link> click OTP, then Approve. That is the actual release (RazorpayX skipped until S5 keys).</li>
              </ol>
              <div className="d-flex flex-wrap gap-2">
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
              </div>
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
                {section === "doctor-earnings" ? "Summary loaded above. Line items appear when visits have captures."
                  : section === "tax" ? "No ledger GST lines in this date range. Rate and totals above are live from TaxConfig."
                  : "No rows yet for this screen. Empty is valid until money moves."}
              </p>
            ) : section === "ledger" || section === "medicine-ledger" || section === "tax" ? (
              <LedgerLinesTable rows={rows} />
            ) : section === "settlements" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Status</th>
                      <th>Created by</th>
                      <th>When</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const id = pick(row, "settlementRunId", "SettlementRunId") || index;
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{pick(row, "status", "Status")}</td>
                          <td>{pick(row, "createdBy", "CreatedBy")}</td>
                          <td>{formatWhen(pick(row, "createdAt", "CreatedAt"))}</td>
                          <td>
                            <Button size="sm" color="soft-info" disabled={busyId === id} onClick={() => openSettlement(id)}>
                              Detail
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : section === "consult-recon" ? (
              <div>
                <h5 className="mb-2">Online collections</h5>
                <p className="text-muted small">Gateway / Razorpay consult orders (not cash, UPI, card POS, or pay link).</p>
                {onlineOrders.length === 0 ? (
                  <p className="text-muted">No online consult collections in this range.</p>
                ) : (
                  <div className="table-responsive mb-4">
                    <Table className="table-nowrap align-middle mb-0" size="sm">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Visit</th>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Channel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onlineOrders.map((row, index) => (
                          <tr key={`on-${pick(row, "paymentOrderId", "PaymentOrderId") || index}`}>
                            <td>{pick(row, "paymentOrderId", "PaymentOrderId")}</td>
                            <td>{pick(row, "patientAppId", "PatientAppId") || "—"}</td>
                            <td>{pick(row, "patientId", "PatientId") || "—"}</td>
                            <td>{pick(row, "doctorId", "DoctorId") || "—"}</td>
                            <td>{money(pick(row, "amount", "Amount"))}</td>
                            <td>{pick(row, "status", "Status") || "—"}</td>
                            <td>{channelLabel(row)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                <h5 className="mb-2">Clinic collections</h5>
                <p className="text-muted small">Cash, offline UPI, card POS, and pay-link reservations from reception.</p>
                {clinicOrders.length === 0 ? (
                  <p className="text-muted mb-0">No clinic collections in this range.</p>
                ) : (
                  <div className="table-responsive">
                    <Table className="table-nowrap align-middle mb-0" size="sm">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Visit</th>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Channel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clinicOrders.map((row, index) => (
                          <tr key={`cl-${pick(row, "paymentOrderId", "PaymentOrderId") || index}`}>
                            <td>{pick(row, "paymentOrderId", "PaymentOrderId")}</td>
                            <td>{pick(row, "patientAppId", "PatientAppId") || "—"}</td>
                            <td>{pick(row, "patientId", "PatientId") || "—"}</td>
                            <td>{pick(row, "doctorId", "DoctorId") || "—"}</td>
                            <td>{money(pick(row, "amount", "Amount"))}</td>
                            <td>{pick(row, "status", "Status") || "—"}</td>
                            <td>{channelLabel(row)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            ) : section === "payouts" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>Payout</th>
                      <th>Payee</th>
                      <th>Payee id</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Settlement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const id = pick(row, "payoutId", "PayoutId") || index;
                      return (
                        <tr key={`${id}-${index}`}>
                          <td>{id}</td>
                          <td>{pick(row, "payeeType", "PayeeType") || "—"}</td>
                          <td>{pick(row, "payeeId", "PayeeId") || "—"}</td>
                          <td>{money(pick(row, "amount", "Amount"))}</td>
                          <td>{pick(row, "status", "Status") || "—"}</td>
                          <td>{pick(row, "settlementRunId", "SettlementRunId") || "—"}</td>
                          <td style={{ minWidth: 220 }}>
                            <div className="d-flex flex-wrap gap-1 align-items-center">
                              <Button size="sm" color="soft-secondary" disabled={busyId === id} onClick={() => runPayoutOtp(id)}>
                                Send OTP
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
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : section === "exceptions" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>Exception</th>
                      <th>When</th>
                      <th>Order</th>
                      <th>Kind</th>
                      <th>Detail</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const id = pick(row, "paymentExceptionId", "PaymentExceptionId") || index;
                      return (
                        <tr key={`${id}-${index}`}>
                          <td>{id}</td>
                          <td>{formatWhen(pick(row, "createdAt", "CreatedAt"))}</td>
                          <td>{pick(row, "paymentOrderId", "PaymentOrderId") || "—"}</td>
                          <td>{pick(row, "kind", "Kind") || "—"}</td>
                          <td className="small">{pick(row, "detail", "Detail") || "—"}</td>
                          <td>{pick(row, "status", "Status") || "—"}</td>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : section === "refunds" || section === "invoices" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>Refund</th>
                      <th>When</th>
                      <th>Original order</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Policy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${pick(row, "refundId", "RefundId") || index}`}>
                        <td>{pick(row, "refundId", "RefundId") || "—"}</td>
                        <td>{formatWhen(pick(row, "at", "At", "createdAt", "CreatedAt"))}</td>
                        <td>{pick(row, "paymentOrderId", "PaymentOrderId") || "—"}</td>
                        <td>{money(pick(row, "amount", "Amount"))}</td>
                        <td>{pick(row, "reason", "Reason") || "—"}</td>
                        <td>{pick(row, "policy", "Policy") || "—"}</td>
                        <td>{pick(row, "status", "Status") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : section === "payees" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>Payee</th>
                      <th>Type</th>
                      <th>Doctor / pharmacy</th>
                      <th>Account name</th>
                      <th>Bank</th>
                      <th>IFSC</th>
                      <th>PAN</th>
                      <th>KYC</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${pick(row, "payeeId", "PayeeId") || index}`}>
                        <td>{pick(row, "payeeId", "PayeeId") || "—"}</td>
                        <td>{pick(row, "payeeType", "PayeeType") || "—"}</td>
                        <td>
                          {pick(row, "doctorId", "DoctorId")
                            ? `Doctor ${pick(row, "doctorId", "DoctorId")}`
                            : pick(row, "pharmacyId", "PharmacyId")
                              ? `Pharmacy ${pick(row, "pharmacyId", "PharmacyId")}`
                              : "—"}
                        </td>
                        <td>{pick(row, "accountName", "AccountName") || "—"}</td>
                        <td>{maskBank(pick(row, "bankAccount", "BankAccount"))}</td>
                        <td>{pick(row, "ifsc", "Ifsc") || "—"}</td>
                        <td>{pick(row, "pan", "Pan") || "—"}</td>
                        <td>{pick(row, "kycStatus", "KycStatus") || "—"}</td>
                        <td>
                          <Button size="sm" color="soft-info" onClick={() => startPayeeEdit(row)}>Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <OrderLinesTable rows={rows} rowKey={section} />
            )}
            {detail && section === "settlements" ? (
              <div className="small border rounded p-3 mt-3 mb-0 bg-light">
                <div className="fw-medium mb-2">
                  Run {pick(detail.run || detail, "settlementRunId", "SettlementRunId") || "—"}
                  {" · "}
                  {pick(detail.run || detail, "status", "Status") || "—"}
                </div>
                {Array.isArray(detail.lines) && detail.lines.length > 0 ? (
                  <Table className="table-nowrap mb-0" size="sm">
                    <thead>
                      <tr>
                        <th>Payee</th>
                        <th>Payee id</th>
                        <th>Amount</th>
                        <th>Ledger line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lines.map((line, index) => (
                        <tr key={pick(line, "settlementLineId", "SettlementLineId") || index}>
                          <td>{pick(line, "payeeType", "PayeeType")}</td>
                          <td>{pick(line, "payeeId", "PayeeId")}</td>
                          <td>{money(pick(line, "amount", "Amount"))}</td>
                          <td>{pick(line, "ledgerEntryId", "LedgerEntryId")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted mb-0">This run has no lines. That happens if Commit ran when there were no unsettled credits (Dry-run count was 0).</p>
                )}
              </div>
            ) : null}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AccountFinancePage;
