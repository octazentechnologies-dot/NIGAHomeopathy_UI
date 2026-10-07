import React, { useMemo, useState } from "react";
import moment from "moment";
import { earningsReport } from "../../../helpers/s5Week5Api";
import {
  Card,
  ChartLegend,
  DonutChart,
  DonutLegend,
  KpiGrid,
  RecordViewModal,
  ReportShell,
  RowActions,
  StackedBarChart,
  StatusPill,
  TableEmpty,
} from "./ReportComponents";
import {
  defaultRange,
  downloadCsv,
  fillDaily,
  formatDate,
  formatInr,
  formatInrShort,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
  useReportLoader,
} from "./reportData";

const COLORS = ["#2563eb", "#14b8a6", "#a78bfa"];
const STATUS_TONE = { Paid: "green", Pending: "amber", Refunded: "slate", Failed: "red" };

const EarningsAnalysisPage = () => {
  document.title = "Doctor Earning Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const { data, loading, error, reload } = useReportLoader(earningsReport, range);
  const [filter, setFilter] = useState("all");
  const [viewState, setViewState] = useState(null);

  const key = rangeKey(range);
  const trend = useMemo(() => fillDaily(range, data?.daily, ["consultation", "medicine", "others"]), [range, data]);
  const totals = data?.totals || {};
  const total = Number(totals.total || 0);

  const breakdown = [
    { label: "Consultation", value: Number(totals.consultation || 0) },
    { label: "Medicine", value: Number(totals.medicine || 0) },
    { label: "Others", value: Number(totals.others || 0) },
  ];

  const rows = useMemo(
    () =>
      (data?.data || []).map((r) => ({
        id: r.paymentOrderId,
        ref: r.reference,
        date: r.date,
        patient: r.patientName || (r.patientId ? `Patient #${r.patientId}` : "—"),
        type: r.type,
        amount: Number(r.amount || 0),
        mode: r.method || "—",
        status: r.status,
        rawStatus: r.rawStatus,
        patientAppId: r.patientAppId,
      })),
    [data]
  );
  const visible = rows.filter((r) => filter === "all" || r.status.toLowerCase() === filter);

  const openView = (r) =>
    setViewState({
      title: "Transaction receipt",
      icon: "ri-bill-line",
      header: `${r.ref} · ${formatInr(r.amount)}`,
      rows: [
        ["Date", r.date ? moment(r.date).format("DD MMM YYYY, hh:mm A") : ""],
        ["Patient", r.patient],
        ["Type", r.type],
        ["Payment mode", r.mode],
        ["Status", `${r.status}${r.rawStatus && r.rawStatus !== r.status.toUpperCase() ? ` (${r.rawStatus})` : ""}`],
        ["Amount", formatInr(r.amount)],
        ["Appointment", r.patientAppId ? `#${r.patientAppId}` : ""],
      ],
    });

  const handleExport = () => {
    downloadCsv(`earnings-analysis-${key}.csv`, [
      ["Doctor Earnings", rangeLabel(range)],
      [],
      ["Date", "Consultation", "Medicine", "Others", "Total"],
      ...trend.categories.map((d, i) => [
        d,
        trend.series.consultation[i],
        trend.series.medicine[i],
        trend.series.others[i],
        trend.series.consultation[i] + trend.series.medicine[i] + trend.series.others[i],
      ]),
      [],
      ["Total earnings", total],
      ["Pending collection", totals.pending ?? 0],
      ["Payout pending", totals.payoutPending ?? 0],
      [],
      ["Reference", "Date", "Patient", "Type", "Amount", "Mode", "Status"],
      ...rows.map((r) => [r.ref, formatDate(r.date), r.patient, r.type, r.amount, r.mode, r.status]),
    ]);
  };

  return (
    <ReportShell
      title="Doctor Earnings"
      subtitle="Earnings from consultations and medicine orders, with pending payouts"
      range={range}
      onRangeChange={setRange}
      onExport={handleExport}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      <KpiGrid
        items={[
          { label: "Total Earnings", value: formatInr(total), tone: "teal", icon: "ri-wallet-3-line" },
          { label: "Consultation Fees", value: formatInr(totals.consultation), tone: "blue", icon: "ri-stethoscope-line" },
          { label: "Medicine Orders", value: formatInr(totals.medicine), tone: "green", icon: "ri-capsule-line" },
          { label: "Payout Pending", value: formatInr(totals.payoutPending), tone: "red", icon: "ri-bank-line", emphasis: true },
        ]}
      />

      <div className="drp-grid">
        <Card
          title="Earnings Trend"
          actions={<ChartLegend items={breakdown.map((b, i) => ({ label: b.label, color: COLORS[i] }))} />}
        >
          <StackedBarChart
            categories={trend.categories}
            colors={COLORS}
            valueFormatter={formatInrShort}
            series={[
              { name: "Consultation", data: trend.series.consultation },
              { name: "Medicine", data: trend.series.medicine },
              { name: "Others", data: trend.series.others },
            ]}
          />
        </Card>
        <Card title="Earnings Breakdown">
          <div className="drp-donut">
            <DonutChart
              labels={breakdown.map((b) => b.label)}
              values={breakdown.map((b) => b.value)}
              colors={COLORS}
              totalValue={formatInrShort(total)}
            />
            <DonutLegend items={breakdown.map((b, i) => ({ label: b.label, color: COLORS[i], value: pct(b.value, total) }))} />
          </div>
        </Card>
      </div>

      <Card
        title="Recent Transactions"
        actions={
          <div className="drp-tabs" role="tablist">
            {["all", "paid", "pending", "refunded"].map((t) => (
              <button key={t} type="button" className={filter === t ? "is-active" : undefined} onClick={() => setFilter(t)}>
                {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        <div className="drp-table-wrap">
          <table className="drp-table">
            <colgroup>
              <col style={{ width: "15%" }} />
              <col />
              <col style={{ width: "17%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
              <col className="drp-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td>
                      <span className="drp-person">
                        <span className="drp-avatar drp-avatar--green">{initialsOf(r.patient)}</span>
                        <span>{r.patient}</span>
                      </span>
                    </td>
                    <td>{r.type}</td>
                    <td className="is-strong">{formatInr(r.amount)}</td>
                    <td><StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill></td>
                    <td>
                      <RowActions actions={[{ label: "View receipt", icon: "ri-eye-line", tone: "view", onClick: () => openView(r) }]} />
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={6}>{loading ? "Loading…" : "No transactions in this view."}</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordViewModal state={viewState} onClose={() => setViewState(null)} />
    </ReportShell>
  );
};

export default EarningsAnalysisPage;
