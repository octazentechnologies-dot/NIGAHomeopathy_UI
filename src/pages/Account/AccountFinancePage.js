import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  accountDoctorEarnings,
  approvePayout,
  createRefund,
  createSettlement,
  getClinicCollections,
  exportLedger,
  getLedger,
  getMedicineLedger,
  getReconciliation,
  getTaxReport,
  listExceptions,
  listPayees,
  updatePayee,
  requestPayeeBankOtp,
  listPayouts,
  listRefunds,
  listSettlements,
  previewRefundPolicy,
  rejectPayout,
  requestPayoutOtp,
  resolveException,
  retryException,
  s4Message,
  settlementDetail,
  unwrapS4,
} from "../../helpers/s4Week4Api";
import {
  exportPayouts,
  exportReconciliation,
  exportSettlements,
} from "../../helpers/s5Week5Api";
import { downloadExport, matrixFromCsvText } from "../../helpers/exportFormats";
import ExportFormatButton from "../../Components/Common/ExportFormatButton";
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

const ACCOUNT_REPORT_LINKS = [
  { path: "ledger", label: "Ledger", icon: "ri-book-line", hint: "All ledger lines by stream, with download." },
  { path: "consult-recon", label: "Consultation recon", icon: "ri-exchange-line", hint: "Online vs clinic consult collections by doctor." },
  { path: "doctor-earnings", label: "Doctor earnings", icon: "ri-money-dollar-circle-line", hint: "Per-doctor visit totals." },
  { path: "medicine-ledger", label: "Medicine ledger", icon: "ri-capsule-line", hint: "Medicine money kept apart from consults." },
  { path: "tax", label: "GST & tax", icon: "ri-percent-line", hint: "GST rate, totals and download." },
  { path: "settlements", label: "Settlements", icon: "ri-shake-hands-line", hint: "Settlement runs and their lines." },
  { path: "exceptions", label: "Exceptions", icon: "ri-error-warning-line", hint: "Open payment exceptions to resolve." },
  { path: "payees", label: "Payees", icon: "ri-bank-line", hint: "Bank and KYC records." },
  { path: "clinic-collections", label: "Clinic collections", icon: "ri-store-2-line", hint: "Cash and UPI collected at reception." },
  { path: "payouts", label: "Payouts", icon: "ri-hand-coin-line", hint: "OTP-approved releases to doctors and pharmacies." },
  { path: "trail", label: "Account trail", icon: "ri-route-line", hint: "Orders and exceptions for one doctor, visit, or payment." },
];

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
    <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
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

const RECON_EXPORT_COLUMNS = [
  { key: "when", label: "When", value: (row) => formatWhen(pick(row, "createdAt", "CreatedAt", "at", "At")) },
  { key: "order", label: "Order", value: (row) => pick(row, "paymentOrderId", "PaymentOrderId") || "" },
  { key: "visit", label: "Visit", value: (row) => pick(row, "patientAppId", "PatientAppId") || "" },
  { key: "patient", label: "Patient", value: (row) => pick(row, "patientId", "PatientId") || "" },
  { key: "doctor", label: "Doctor", value: (row) => pick(row, "doctorId", "DoctorId") || "" },
  { key: "amount", label: "Amount", value: (row) => pick(row, "amount", "Amount") ?? "" },
  { key: "status", label: "Status", value: (row) => pick(row, "status", "Status") || "" },
  { key: "channel", label: "Channel", value: (row) => channelLabel(row) },
];

const LEDGER_EXPORT_COLUMNS = [
  { key: "when", label: "When", value: (row) => formatWhen(pick(row, "at", "At", "createdAt", "CreatedAt")) },
  { key: "stream", label: "Stream", value: (row) => pick(row, "stream", "Stream") || "" },
  { key: "direction", label: "Direction", value: (row) => pick(row, "direction", "Direction") || "" },
  { key: "amount", label: "Amount", value: (row) => pick(row, "amount", "Amount") ?? "" },
  { key: "gst", label: "GST", value: (row) => pick(row, "gst", "Gst") ?? "" },
  { key: "type", label: "Type", value: (row) => pick(row, "entityType", "EntityType") || "" },
  { key: "ref", label: "Reference", value: (row) => pick(row, "entityId", "EntityId") || "" },
  { key: "order", label: "Order", value: (row) => pick(row, "paymentOrderId", "PaymentOrderId") || "" },
];

const OrderLinesTable = ({ rows, rowKey = "ord", hideDoctor = false }) => (
  <div className="table-responsive">
    <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
      <thead>
        <tr>
          <th>When</th>
          <th>Order</th>
          <th>Visit</th>
          <th>Patient</th>
          {hideDoctor ? null : <th>Doctor</th>}
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
            {hideDoctor ? null : <td>{pick(row, "doctorId", "DoctorId") || "—"}</td>}
            <td>{money(pick(row, "amount", "Amount"))}</td>
            <td>{pick(row, "status", "Status") || "—"}</td>
            <td>{channelLabel(row)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

const doctorKeyOf = (row) => {
  const id = pick(row, "doctorId", "DoctorId");
  return id == null || id === "" ? "unknown" : String(id);
};

const patientKeyOf = (row) => {
  const id = pick(row, "patientId", "PatientId");
  return id == null || id === "" ? "unknown" : String(id);
};

const sumOrderAmount = (list) =>
  list.reduce((acc, row) => acc + (Number(pick(row, "amount", "Amount")) || 0), 0);

/** Group consult-recon orders by doctor, with online/clinic split. */
const groupReconByDoctor = (list) => {
  const map = new Map();
  list.forEach((row) => {
    const key = doctorKeyOf(row);
    if (!map.has(key)) {
      map.set(key, {
        doctorId: key === "unknown" ? null : key,
        doctorName: pick(row, "doctorName", "DoctorName") || null,
        orders: [],
        online: [],
        clinic: [],
      });
    }
    const bucket = map.get(key);
    bucket.orders.push(row);
    if (isClinicCollection(row)) bucket.clinic.push(row);
    else bucket.online.push(row);
    if (!bucket.doctorName) {
      bucket.doctorName = pick(row, "doctorName", "DoctorName") || bucket.doctorName;
    }
  });
  return Array.from(map.values())
    .map((bucket) => ({
      ...bucket,
      count: bucket.orders.length,
      onlineCount: bucket.online.length,
      clinicCount: bucket.clinic.length,
      total: sumOrderAmount(bucket.orders),
      onlineTotal: sumOrderAmount(bucket.online),
      clinicTotal: sumOrderAmount(bucket.clinic),
    }))
    .sort((a, b) => b.total - a.total || String(a.doctorId).localeCompare(String(b.doctorId)));
};

/** Group orders by patient for one doctor. */
const groupReconByPatient = (list) => {
  const map = new Map();
  list.forEach((row) => {
    const key = patientKeyOf(row);
    if (!map.has(key)) {
      map.set(key, {
        patientId: key === "unknown" ? null : key,
        patientName: pick(row, "patientName", "PatientName") || null,
        orders: [],
      });
    }
    const bucket = map.get(key);
    bucket.orders.push(row);
    if (!bucket.patientName) {
      bucket.patientName = pick(row, "patientName", "PatientName") || bucket.patientName;
    }
  });
  return Array.from(map.values())
    .map((bucket) => ({
      ...bucket,
      count: bucket.orders.length,
      total: sumOrderAmount(bucket.orders),
    }))
    .sort((a, b) => b.total - a.total || String(a.patientId).localeCompare(String(b.patientId)));
};

const AccountFinancePage = ({ section = "ledger" }) => {
  const meta = SECTIONS[section] || SECTIONS.ledger;
  const location = useLocation();
  const adminReportsBase = location.pathname.startsWith("/admin");
  const reportsHome = adminReportsBase ? "/admin/reports" : "/account/reports";
  const dashboardHome = adminReportsBase ? "/dashboard" : "/accountdashboard";
  const reportLinks = useMemo(
    () =>
      ACCOUNT_REPORT_LINKS.map((item) => ({
        ...item,
        to: adminReportsBase ? `/admin/reports/${item.path}` : `/account/${item.path}`,
      })),
    [adminReportsBase]
  );
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [otpById, setOtpById] = useState({});
  const [otpMetaById, setOtpMetaById] = useState({});
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [refundForm, setRefundForm] = useState({ paymentOrderId: "", amount: "", reason: "" });
  const [refundPolicy, setRefundPolicy] = useState(null);
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
  const [reconDoctorId, setReconDoctorId] = useState(null);
  const [reconPatientId, setReconPatientId] = useState(null);

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
          response = await accountDoctorEarnings({ from: ledgerFrom, to: ledgerTo });
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
    setReconDoctorId(null);
    setReconPatientId(null);
  }, [section]);

  const clinicOrders = useMemo(() => rows.filter(isClinicCollection), [rows]);
  const onlineOrders = useMemo(() => rows.filter((row) => !isClinicCollection(row)), [rows]);
  const sumAmount = (list) => sumOrderAmount(list);

  const reconDoctors = useMemo(
    () => (section === "consult-recon" ? groupReconByDoctor(rows) : []),
    [section, rows]
  );

  const reconDoctor = useMemo(
    () =>
      reconDoctorId == null
        ? null
        : reconDoctors.find((d) => String(d.doctorId ?? "unknown") === String(reconDoctorId)) || null,
    [reconDoctors, reconDoctorId]
  );

  const reconPatients = useMemo(
    () => (reconDoctor ? groupReconByPatient(reconDoctor.orders) : []),
    [reconDoctor]
  );

  const reconPatient = useMemo(
    () =>
      reconPatientId == null
        ? null
        : reconPatients.find((p) => String(p.patientId ?? "unknown") === String(reconPatientId)) || null,
    [reconPatients, reconPatientId]
  );

  const runLedgerExport = async (format) => {
    setBusyId("ledger-export");
    setError("");
    try {
      if (format === "csv") {
        const response = await exportLedger({
          from: ledgerFrom,
          to: ledgerTo,
          stream: ledgerStream || undefined,
        });
        const envelope = unwrapS4(response) || response;
        const csv = envelope.csv || envelope.Csv || "";
        if (csv) {
          const parsed = matrixFromCsvText(csv);
          downloadExport({
            format: "csv",
            fileBase: (envelope.fileName || envelope.FileName || "ledger").replace(/\.csv$/i, ""),
            columns: parsed.columns,
            rows: parsed.rows,
            title: "Ledger",
          });
          return true;
        }
      }
      downloadExport({
        format,
        fileBase: "ledger",
        title: "Ledger",
        columns: LEDGER_EXPORT_COLUMNS,
        rows,
      });
      return true;
    } catch (err) {
      if (err?.code === "EMPTY") setError("Nothing to export for this date range.");
      else setError(s4Message(err));
      return true;
    } finally {
      setBusyId(null);
    }
  };

  const hasOtpCooldown = Object.values(otpMetaById).some((meta) => meta.resendAt > nowTick || meta.expiresAt > nowTick);
  useEffect(() => {
    if (!hasOtpCooldown) return undefined;
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasOtpCooldown]);

  const runPayoutOtp = async (id) => {
    setBusyId(id);
    setError("");
    setNote("");
    try {
      const response = await requestPayoutOtp(id);
      const body = unwrapS4(response) || response || {};
      const code = body.devCode || body.DevCode || body.data?.devCode;
      const resendAfter = Number(body.resendAfterSeconds ?? body.ResendAfterSeconds ?? 30);
      const ttlMinutes = Number(body.expiresInMinutes ?? body.ExpiresInMinutes ?? 10);
      const sentAt = Date.now();
      setNowTick(sentAt);
      setOtpMetaById((current) => ({
        ...current,
        [id]: { resendAt: sentAt + resendAfter * 1000, expiresAt: sentAt + ttlMinutes * 60000 },
      }));
      if (code) setOtpById((current) => ({ ...current, [id]: String(code) }));
      const message = body.message || response?.message || "OTP sent.";
      setNote(
        code
          ? `${message} Dev code ${code} is filled in. Click Approve to release payout #${id}.`
          : `${message} Enter the 6-digit code, then click Approve.`
      );
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runApprove = async (id) => {
    const otp = String(otpById[id] || "").trim();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP for this payout, then click Approve.");
      return;
    }
    setBusyId(id);
    setError("");
    setNote("");
    try {
      await approvePayout(id, { otp });
      setOtpById((current) => ({ ...current, [id]: "" }));
      setOtpMetaById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setNote(`Payout #${id} approved.`);
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const runReject = async (id) => {
    const answer = await Swal.fire({
      title: `Reject payout #${id}?`,
      input: "text",
      inputLabel: "Reason",
      inputPlaceholder: "Why is this payout rejected?",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#d33",
      inputValidator: (value) => (!String(value || "").trim() ? "A reason is required." : undefined),
    });
    if (!answer.isConfirmed) return;
    setBusyId(id);
    setError("");
    setNote("");
    try {
      await rejectPayout(id, { reason: String(answer.value).trim() });
      setNote(`Payout #${id} rejected.`);
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

  const checkRefundPolicy = async () => {
    const orderId = Number(refundForm.paymentOrderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setError("Enter a valid payment order id.");
      return;
    }
    setBusyId("refund-policy");
    setError("");
    setRefundPolicy(null);
    try {
      const body = unwrapS4(await previewRefundPolicy(orderId)) || {};
      const policy = {
        policy: pick(body, "policy", "Policy") || "",
        amount: Number(pick(body, "amount", "Amount") || 0),
        reason: pick(body, "reason", "Reason") || "",
      };
      setRefundPolicy(policy);
      if (policy.policy !== "NONE" && policy.amount > 0) {
        setRefundForm((current) => ({ ...current, amount: String(policy.amount) }));
      }
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
      setRefundPolicy(null);
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

  const exportClinicFile = (format) => {
    downloadExport({
      format,
      fileBase: "clinic-collections",
      title: "Clinic collections",
      columns: RECON_EXPORT_COLUMNS,
      rows,
    });
    return true;
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

  const runReportExport = async (format, call, fallbackName, clientColumns, clientRows, title) => {
    setError("");
    try {
      if (format === "csv" && call) {
        const response = await call();
        const envelope = response?.csv || response?.Csv ? response : response?.data || response;
        const csv = envelope?.csv || envelope?.Csv || "";
        if (csv) {
          const parsed = matrixFromCsvText(csv);
          downloadExport({
            format: "csv",
            fileBase: String(fallbackName || "report").replace(/\.csv$/i, ""),
            columns: parsed.columns,
            rows: parsed.rows,
            title: title || "Report",
          });
          return true;
        }
      }
      downloadExport({
        format,
        fileBase: String(fallbackName || "report").replace(/\.csv$/i, ""),
        title: title || "Report",
        columns: clientColumns,
        rows: clientRows,
      });
      return true;
    } catch (err) {
      if (err?.code === "EMPTY") setError("Nothing to export.");
      else setError(s4Message(err) || err?.message || "Export failed.");
      return true;
    }
  };

  const exportTaxFile = (format) => {
    const csv = detail?.csv || detail?.Csv || "";
    if (csv) {
      const parsed = matrixFromCsvText(csv);
      downloadExport({
        format,
        fileBase: String(detail.fileName || detail.FileName || "tax").replace(/\.(csv|xlsx|pdf)$/i, ""),
        title: "GST & tax",
        columns: parsed.columns,
        rows: parsed.rows,
      });
      return true;
    }
    downloadExport({
      format,
      fileBase: "tax",
      title: "GST & tax",
      columns: [
        { key: "when", label: "When", value: (row) => formatWhen(pick(row, "at", "At", "createdAt", "CreatedAt")) },
        { key: "amount", label: "Amount", value: (row) => pick(row, "amount", "Amount") ?? "" },
        { key: "gst", label: "GST", value: (row) => pick(row, "gst", "Gst", "gstAmount", "GstAmount") ?? "" },
      ],
      rows,
    });
    return true;
  };

  return (
    <div className="page-content admin-dashboard-page account-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title account-page-title">{meta.title}</h2>
            <p className="clinic-page-subtitle account-page-subtitle mb-0">{meta.subtitle}</p>
          </div>
          <div className="clinic-table-actions">
            <Link to={dashboardHome} className="btn btn-sm btn-soft-secondary clinic-action-btn">
              <i className="ri-home-4-line" aria-hidden="true" />
              {adminReportsBase ? "Admin home" : "Account home"}
            </Link>
            {adminReportsBase && section !== "reports" ? (
              <Link to={reportsHome} className="btn btn-sm btn-soft-secondary clinic-action-btn">
                <i className="ri-bar-chart-line" aria-hidden="true" />
                Reports
              </Link>
            ) : null}
            <button type="button" className="btn btn-sm clinic-primary-btn" onClick={load} disabled={loading}>
              <i className="ri-refresh-line" aria-hidden="true" />
              Refresh
            </button>
            {section === "consult-recon" || section === "reports" ? (
              <ExportFormatButton
                label="Download"
                className="clinic-action-btn"
                disabled={!rows.length && section === "consult-recon"}
                onExport={(format) =>
                  runReportExport(
                    format,
                    exportReconciliation,
                    "reconciliation",
                    RECON_EXPORT_COLUMNS,
                    rows,
                    "Consultation reconciliation"
                  )
                }
              />
            ) : null}
            {section === "settlements" || section === "reports" ? (
              <ExportFormatButton
                label="Download settlements"
                className="clinic-action-btn"
                onExport={(format) =>
                  runReportExport(
                    format,
                    exportSettlements,
                    "settlements",
                    [
                      { key: "id", label: "Settlement", value: (row) => pick(row, "settlementId", "SettlementId") || "" },
                      { key: "status", label: "Status", value: (row) => pick(row, "status", "Status") || "" },
                      { key: "createdBy", label: "Created by", value: (row) => pick(row, "createdBy", "CreatedBy") || "" },
                      { key: "createdAt", label: "Created", value: (row) => formatWhen(pick(row, "createdAt", "CreatedAt")) },
                    ],
                    rows,
                    "Settlements"
                  )
                }
              />
            ) : null}
            {section === "payouts" || section === "reports" ? (
              <ExportFormatButton
                label="Download payouts"
                className="clinic-action-btn"
                onExport={(format) =>
                  runReportExport(
                    format,
                    exportPayouts,
                    "payouts",
                    [
                      { key: "id", label: "Payout", value: (row) => pick(row, "payoutId", "PayoutId") || "" },
                      { key: "payee", label: "Payee", value: (row) => pick(row, "payeeName", "PayeeName") || "" },
                      { key: "amount", label: "Amount", value: (row) => pick(row, "amount", "Amount") ?? "" },
                      { key: "status", label: "Status", value: (row) => pick(row, "status", "Status") || "" },
                      { key: "created", label: "Created", value: (row) => formatWhen(pick(row, "createdAt", "CreatedAt")) },
                    ],
                    rows,
                    "Payouts"
                  )
                }
              />
            ) : null}
          </div>
        </div>

        {error ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}
        {note ? <Alert color="success" className="py-2 small">{note}</Alert> : null}

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
                  <ExportFormatButton
                    label="Download"
                    disabled={!detail?.csv && !rows.length}
                    onExport={exportTaxFile}
                  />
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

        {section === "doctor-earnings" ? (
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
                  <Button className="account-primary-btn" onClick={load} disabled={loading}>Apply dates</Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ) : null}

        {section === "doctor-earnings" && detail && !loading ? (
          <>
            <Row className="g-3 mb-3">
              <Col md><Card className="admin-dash-card"><CardBody><div className="text-muted small">Visits</div><div className="fs-4">{detail.visitCount ?? 0}</div></CardBody></Card></Col>
              <Col md><Card className="admin-dash-card"><CardBody><div className="text-muted small">Total</div><div className="fs-4">{money(detail.totalCaptured)}</div></CardBody></Card></Col>
              <Col md><Card className="admin-dash-card"><CardBody><div className="text-muted small">Online</div><div className="fs-4">{money(detail.onlineCaptured)}</div></CardBody></Card></Col>
              <Col md><Card className="admin-dash-card"><CardBody><div className="text-muted small">At clinic</div><div className="fs-4">{money(detail.clinicCollected)}</div></CardBody></Card></Col>
              <Col md><Card className="admin-dash-card"><CardBody><div className="text-muted small">Pending payouts</div><div className="fs-4">{money(detail.pendingPayoutAmount)}</div></CardBody></Card></Col>
            </Row>
            {Array.isArray(detail.byDoctor) && detail.byDoctor.length > 0 ? (
              <Card className="admin-dash-card mb-3">
                <CardBody>
                  <h5 className="mb-3">By doctor</h5>
                  <div className="table-responsive">
                    <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Visits</th>
                          <th>Total</th>
                          <th>Online</th>
                          <th>At clinic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.byDoctor.map((doc) => (
                          <tr key={doc.doctorId}>
                            <td>{doc.doctorName} <span className="text-muted small">#{doc.doctorId}</span></td>
                            <td>{doc.visitCount}</td>
                            <td>{money(doc.totalCaptured)}</td>
                            <td>{money(doc.onlineCaptured)}</td>
                            <td>{money(doc.clinicCollected)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            ) : null}
          </>
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
                  <ExportFormatButton
                    label="Download"
                    disabled={busyId === "ledger-export"}
                    onExport={runLedgerExport}
                  />
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
                  <ExportFormatButton
                    label="Download"
                    disabled={!rows.length}
                    onExport={exportClinicFile}
                  />
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

        {section === "reports" ? (
          <Row className="g-3 mb-3">
            {reportLinks.map((item) => (
              <Col xs={12} sm={6} lg={3} key={item.to}>
                <Card className="admin-dash-card h-100">
                  <CardBody>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={`${item.icon} text-info fs-4`} aria-hidden="true" />
                      <h6 className="mb-0">{item.label}</h6>
                    </div>
                    <p className="text-muted small mb-2">{item.hint}</p>
                    <Link to={item.to} className="account-kpi-link">Open report</Link>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        ) : null}

        {section === "reports" ? (
          <h5 className="mb-2">Clinic collections (last 30 days)</h5>
        ) : null}

        {section === "settlements" ? (
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
                <li>
                  On{" "}
                  <Link to={adminReportsBase ? "/admin/reports/payouts" : "/account/payouts"}>Payouts</Link> click OTP,
                  then Approve. That is the actual release (RazorpayX skipped until S5 keys).
                </li>
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
                <Col md={2}>
                  <Label>Payment order id</Label>
                  <Input
                    value={refundForm.paymentOrderId}
                    onChange={(e) => {
                      setRefundForm({ ...refundForm, paymentOrderId: e.target.value });
                      setRefundPolicy(null);
                    }}
                  />
                </Col>
                <Col md={2}>
                  <Button
                    color="secondary"
                    outline
                    className="w-100"
                    disabled={busyId === "refund-policy" || !refundForm.paymentOrderId}
                    onClick={checkRefundPolicy}
                  >
                    {busyId === "refund-policy" ? "Checking…" : "Check policy"}
                  </Button>
                </Col>
                <Col md={2}>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={refundForm.amount}
                    max={refundPolicy && refundPolicy.amount > 0 ? refundPolicy.amount : undefined}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  />
                </Col>
                <Col md={4}>
                  <Label>Reason</Label>
                  <Input
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Button
                    className="account-primary-btn w-100"
                    disabled={busyId === "refund" || refundPolicy?.policy === "NONE"}
                    onClick={runRefund}
                  >
                    Save refund
                  </Button>
                </Col>
              </Row>
              {refundPolicy ? (
                <Alert
                  color={refundPolicy.policy === "NONE" ? "warning" : "info"}
                  className="mt-3 mb-0 py-2"
                  data-testid="refund-policy"
                >
                  <strong>
                    {refundPolicy.policy === "FULL"
                      ? "Full refund"
                      : refundPolicy.policy === "PARTIAL"
                        ? "Partial refund"
                        : "No refund"}
                  </strong>
                  {refundPolicy.policy !== "NONE" ? ` up to ₹${refundPolicy.amount}` : ""}. {refundPolicy.reason}
                </Alert>
              ) : null}
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
                <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
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
                {reconDoctorId == null ? (
                  <>
                    <h5 className="mb-1">Doctors</h5>
                    <p className="text-muted small mb-3">
                      All consult collections by doctor. Click a doctor to see patients.
                    </p>
                    {reconDoctors.length === 0 ? (
                      <p className="text-muted mb-0">No consult collections in this range.</p>
                    ) : (
                      <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
                          <thead>
                            <tr>
                              <th>Doctor</th>
                              <th>Collections</th>
                              <th>Online</th>
                              <th>Clinic</th>
                              <th>Total</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reconDoctors.map((doc) => {
                              const key = String(doc.doctorId ?? "unknown");
                              const label = doc.doctorName
                                ? `${doc.doctorName} · ${doc.doctorId || "—"}`
                                : doc.doctorId || "Unknown doctor";
                              return (
                                <tr
                                  key={key}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setReconDoctorId(key);
                                    setReconPatientId(null);
                                  }}
                                >
                                  <td className="fw-medium">{label}</td>
                                  <td>{doc.count}</td>
                                  <td>
                                    {doc.onlineCount} · {money(doc.onlineTotal)}
                                  </td>
                                  <td>
                                    {doc.clinicCount} · {money(doc.clinicTotal)}
                                  </td>
                                  <td>{money(doc.total)}</td>
                                  <td className="text-end">
                                    <Button
                                      size="sm"
                                      color="soft-info"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReconDoctorId(key);
                                        setReconPatientId(null);
                                      }}
                                    >
                                      Patients
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                ) : reconPatientId == null ? (
                  <>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                      <div>
                        <h5 className="mb-1">
                          Patients · Doctor{" "}
                          {reconDoctor?.doctorName
                            ? `${reconDoctor.doctorName} (${reconDoctor.doctorId || "—"})`
                            : reconDoctor?.doctorId || "—"}
                        </h5>
                        <p className="text-muted small mb-0">
                          {reconDoctor?.count || 0} collections · {money(reconDoctor?.total || 0)}. Click a patient for
                          their orders.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        color="soft-secondary"
                        onClick={() => {
                          setReconDoctorId(null);
                          setReconPatientId(null);
                        }}
                      >
                        Back to doctors
                      </Button>
                    </div>
                    {reconPatients.length === 0 ? (
                      <p className="text-muted mb-0">No patients for this doctor.</p>
                    ) : (
                      <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
                          <thead>
                            <tr>
                              <th>Patient</th>
                              <th>Collections</th>
                              <th>Total</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reconPatients.map((pat) => {
                              const key = String(pat.patientId ?? "unknown");
                              const label = pat.patientName
                                ? `${pat.patientName} · ${pat.patientId || "—"}`
                                : pat.patientId || "Unknown patient";
                              return (
                                <tr
                                  key={key}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setReconPatientId(key)}
                                >
                                  <td className="fw-medium">{label}</td>
                                  <td>{pat.count}</td>
                                  <td>{money(pat.total)}</td>
                                  <td className="text-end">
                                    <Button
                                      size="sm"
                                      color="soft-info"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReconPatientId(key);
                                      }}
                                    >
                                      Orders
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                      <div>
                        <h5 className="mb-1">
                          Collections · Patient{" "}
                          {reconPatient?.patientName
                            ? `${reconPatient.patientName} (${reconPatient.patientId || "—"})`
                            : reconPatient?.patientId || "—"}
                        </h5>
                        <p className="text-muted small mb-0">
                          Doctor {reconDoctor?.doctorId || "—"} · {reconPatient?.count || 0} orders ·{" "}
                          {money(reconPatient?.total || 0)}
                        </p>
                      </div>
                      <div className="d-flex gap-2">
                        <Button size="sm" color="soft-secondary" onClick={() => setReconPatientId(null)}>
                          Back to patients
                        </Button>
                        <Button
                          size="sm"
                          color="soft-secondary"
                          onClick={() => {
                            setReconDoctorId(null);
                            setReconPatientId(null);
                          }}
                        >
                          All doctors
                        </Button>
                      </div>
                    </div>
                    {!reconPatient?.orders?.length ? (
                      <p className="text-muted mb-0">No collections for this patient.</p>
                    ) : (
                      <OrderLinesTable rows={reconPatient.orders} rowKey="recon-pat" hideDoctor />
                    )}
                  </>
                )}
              </div>
            ) : section === "payouts" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
                  <thead>
                    <tr>
                      <th>Payout</th>
                      <th>Payee</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Settlement</th>
                      <th>Created</th>
                      <th>Decision</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const id = pick(row, "payoutId", "PayoutId") || index;
                      const status = String(pick(row, "status", "Status") || "").toUpperCase();
                      const isPending = status === "PENDING";
                      const busy = busyId === id;
                      const otpMeta = otpMetaById[id];
                      const resendIn = otpMeta ? Math.max(0, Math.ceil((otpMeta.resendAt - nowTick) / 1000)) : 0;
                      const otpLive = Boolean(otpMeta && otpMeta.expiresAt > nowTick);
                      const otpValue = String(otpById[id] || "");
                      const canApprove = isPending && otpLive && /^\d{6}$/.test(otpValue) && !busy;
                      const payeeType = pick(row, "payeeType", "PayeeType") || "—";
                      const payeeName = pick(row, "payeeName", "PayeeName");
                      const decidedAt = pick(row, "decidedAt", "DecidedAt");
                      const decidedBy = pick(row, "decidedByName", "DecidedByName", "decidedBy", "DecidedBy");
                      const rejectReason = pick(row, "rejectReason", "RejectReason");
                      const statusTone = status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning";
                      return (
                        <tr key={`${id}-${index}`}>
                          <td>#{id}</td>
                          <td>
                            <div>{payeeName || `${payeeType} ${pick(row, "payeeId", "PayeeId") || ""}`}</div>
                            <div className="small text-muted">{payeeType} · id {pick(row, "payeeId", "PayeeId") || "—"}</div>
                          </td>
                          <td>{money(pick(row, "amount", "Amount"))}</td>
                          <td>
                            <span className={`badge bg-${statusTone}-subtle text-${statusTone}`}>{status || "—"}</span>
                          </td>
                          <td>{pick(row, "settlementRunId", "SettlementRunId") || "—"}</td>
                          <td>{formatWhen(pick(row, "createdAt", "CreatedAt"))}</td>
                          <td className="small">
                            {decidedAt ? (
                              <>
                                <div>{formatWhen(decidedAt)}</div>
                                {decidedBy ? <div className="text-muted">by {decidedBy}</div> : null}
                                {rejectReason ? <div className="text-danger">{rejectReason}</div> : null}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{ minWidth: 300 }}>
                            {isPending ? (
                              <div className="d-flex flex-wrap gap-1 align-items-center">
                                <Button
                                  size="sm"
                                  color="soft-secondary"
                                  disabled={busy || resendIn > 0}
                                  onClick={() => runPayoutOtp(id)}
                                >
                                  {busy && !otpLive ? "Sending…" : resendIn > 0 ? `Resend in ${resendIn}s` : otpMeta ? "Resend OTP" : "Send OTP"}
                                </Button>
                                <Input
                                  bsSize="sm"
                                  style={{ width: 90 }}
                                  placeholder="OTP"
                                  inputMode="numeric"
                                  maxLength={6}
                                  disabled={!otpLive || busy}
                                  value={otpValue}
                                  onChange={(e) =>
                                    setOtpById({ ...otpById, [id]: e.target.value.replace(/\D/g, "").slice(0, 6) })
                                  }
                                />
                                <Button size="sm" color="soft-success" disabled={!canApprove} onClick={() => runApprove(id)}>
                                  Approve
                                </Button>
                                <Button size="sm" color="soft-danger" disabled={busy} onClick={() => runReject(id)}>
                                  Reject
                                </Button>
                                {otpMeta && !otpLive ? (
                                  <span className="small text-danger w-100">OTP expired. Send a new one.</span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="small text-muted">No action. Payout is {status.toLowerCase() || "closed"}.</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : section === "exceptions" ? (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
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
                <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
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
                <Table className="table-nowrap align-middle mb-0 clinic-data-table" size="sm">
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
                          <button
                            type="button"
                            className="btn btn-sm btn-soft-primary clinic-action-btn"
                            onClick={() => startPayeeEdit(row)}
                          >
                            <i className="ri-pencil-line" aria-hidden="true" />
                            Edit
                          </button>
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
                  <Table className="table-nowrap mb-0 clinic-data-table" size="sm">
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
