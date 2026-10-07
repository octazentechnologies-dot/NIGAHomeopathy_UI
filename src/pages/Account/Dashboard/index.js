import React, { useEffect, useState } from "react";
import { Alert, Container } from "reactstrap";
import SummaryWidgets from "../components/SummaryWidgets";
import {
  accountDoctorEarnings,
  getReconciliation,
  getTaxReport,
  listExceptions,
  listPayouts,
  listRefunds,
  s4Message,
} from "../../../helpers/s4Week4Api";
import "../components/accountDashboard.css";

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹ ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const listOf = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const bodyOf = (response) =>
  response?.data && typeof response.data === "object" && !Array.isArray(response.data) ? response.data : response || {};

const AccountDashboard = () => {
  document.title = "Account Dashboard | Niga Homeocentrum";
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().slice(0, 10);

    Promise.allSettled([
      getReconciliation({ from, to }),
      accountDoctorEarnings({ from, to }),
      listPayouts(),
      listRefunds(),
      getTaxReport({ from, to }),
      listExceptions("OPEN"),
    ]).then(([recon, earnings, payouts, refunds, tax, exceptions]) => {
      if (cancelled) return;
      const next = {};
      if (recon.status === "fulfilled") {
        const body = bodyOf(recon.value);
        next.ledger = { main: money(body.capturedOrCollected), sub: `${body.count ?? 0} orders` };
      }
      if (earnings.status === "fulfilled") {
        const body = bodyOf(earnings.value);
        const doctors = Array.isArray(body.byDoctor) ? body.byDoctor.length : 0;
        next.earnings = { main: money(body.totalCaptured), sub: `${doctors} doctor${doctors === 1 ? "" : "s"}` };
      }
      if (payouts.status === "fulfilled") {
        const pending = listOf(payouts.value).filter(
          (row) => String(row.status || row.Status || "").toUpperCase() === "PENDING"
        );
        const amount = pending.reduce((sum, row) => sum + (Number(row.amount ?? row.Amount) || 0), 0);
        next.payouts = { main: money(amount), sub: `${pending.length} pending` };
      }
      if (refunds.status === "fulfilled") {
        const rows = listOf(refunds.value);
        const amount = rows.reduce((sum, row) => sum + (Number(row.amount ?? row.Amount) || 0), 0);
        next.refunds = { main: money(amount), sub: `${rows.length} refund${rows.length === 1 ? "" : "s"}` };
      }
      if (tax.status === "fulfilled") {
        const body = tax.value || {};
        const rate = body.gstRate ?? body.GstRate ?? 0;
        next.tax = { main: money(body.gstTotal ?? body.GstTotal ?? 0), sub: `rate ${rate}%` };
      }
      if (exceptions.status === "fulfilled") {
        const rows = listOf(exceptions.value);
        next.exceptions = { main: String(rows.length), sub: rows.length ? "needs action" : "all clear" };
      }
      const failed = [recon, earnings, payouts, refunds, tax, exceptions].find((r) => r.status === "rejected");
      setError(failed ? s4Message(failed.reason) : "");
      setValues(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page account-dashboard-page">
        <Container fluid>
          {error ? <Alert color="warning">Some numbers could not load: {error}</Alert> : null}
          <SummaryWidgets values={values} loading={loading} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AccountDashboard;
