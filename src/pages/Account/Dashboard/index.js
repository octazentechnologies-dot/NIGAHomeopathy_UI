import React, { useEffect, useState } from "react";
import { Alert, Container } from "reactstrap";
import SummaryWidgets from "../components/SummaryWidgets";
import AccountQuickActions from "../components/AccountQuickActions";
import AccountCharts from "../components/AccountCharts";
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

const dayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const lastSevenDays = (orders) => {
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push(date);
  }
  const totals = {};
  (Array.isArray(orders) ? orders : []).forEach((row) => {
    const status = String(row.status || row.Status || "").toUpperCase();
    if (status !== "CAPTURED" && status !== "COLLECTED") return;
    const key = dayKey(row.createdAt || row.CreatedAt);
    if (!key) return;
    totals[key] = (totals[key] || 0) + (Number(row.amount ?? row.Amount) || 0);
  });
  return {
    weeklyLabels: days.map((date) => date.toLocaleDateString("en-IN", { weekday: "short" })),
    weeklyCollected: days.map((date) => totals[dayKey(date)] || 0),
  };
};

const AccountDashboard = () => {
  document.title = "Account Dashboard | Niga Homeocentrum";
  const [values, setValues] = useState({});
  const [figures, setFigures] = useState(null);
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
      const chart = {
        collected: 0,
        earnings: 0,
        pendingPayouts: 0,
        refunds: 0,
        gstTotal: 0,
        openExceptions: 0,
        pendingPayoutCount: 0,
        otherPayoutCount: 0,
        weeklyLabels: lastSevenDays([]).weeklyLabels,
        weeklyCollected: [0, 0, 0, 0, 0, 0, 0],
      };

      if (recon.status === "fulfilled") {
        const body = bodyOf(recon.value);
        const collected = Number(body.capturedOrCollected) || 0;
        const orders = body.orders || body.Orders || [];
        const week = lastSevenDays(orders);
        chart.collected = collected;
        chart.weeklyLabels = week.weeklyLabels;
        chart.weeklyCollected = week.weeklyCollected;
        next.ledger = { main: money(collected), sub: `${body.count ?? orders.length ?? 0} orders` };
      }
      if (earnings.status === "fulfilled") {
        const body = bodyOf(earnings.value);
        const doctors = Array.isArray(body.byDoctor) ? body.byDoctor.length : 0;
        chart.earnings = Number(body.totalCaptured) || 0;
        next.earnings = { main: money(body.totalCaptured), sub: `${doctors} doctor${doctors === 1 ? "" : "s"}` };
      }
      if (payouts.status === "fulfilled") {
        const rows = listOf(payouts.value);
        const pending = rows.filter(
          (row) => String(row.status || row.Status || "").toUpperCase() === "PENDING"
        );
        const amount = pending.reduce((sum, row) => sum + (Number(row.amount ?? row.Amount) || 0), 0);
        chart.pendingPayouts = amount;
        chart.pendingPayoutCount = pending.length;
        chart.otherPayoutCount = Math.max(0, rows.length - pending.length);
        next.payouts = { main: money(amount), sub: `${pending.length} pending` };
      }
      if (refunds.status === "fulfilled") {
        const rows = listOf(refunds.value);
        const amount = rows.reduce((sum, row) => sum + (Number(row.amount ?? row.Amount) || 0), 0);
        chart.refunds = amount;
        next.refunds = { main: money(amount), sub: `${rows.length} refund${rows.length === 1 ? "" : "s"}` };
      }
      if (tax.status === "fulfilled") {
        const body = tax.value || {};
        const rate = body.gstRate ?? body.GstRate ?? 0;
        chart.gstTotal = Number(body.gstTotal ?? body.GstTotal) || 0;
        next.tax = { main: money(chart.gstTotal), sub: `rate ${rate}%` };
      }
      if (exceptions.status === "fulfilled") {
        const rows = listOf(exceptions.value);
        chart.openExceptions = rows.length;
        next.exceptions = { main: String(rows.length), sub: rows.length ? "needs action" : "all clear" };
      }

      const failed = [recon, earnings, payouts, refunds, tax, exceptions].find((r) => r.status === "rejected");
      setError(failed ? s4Message(failed.reason) : "");
      setValues(next);
      setFigures(chart);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page account-dashboard-page clinic-workspace-page">
        <Container fluid>
          {error ? <Alert color="warning" className="py-2 small">Some numbers could not load: {error}</Alert> : null}
          <SummaryWidgets values={values} loading={loading} />
          <AccountQuickActions />
          <AccountCharts figures={figures} loading={loading} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AccountDashboard;
