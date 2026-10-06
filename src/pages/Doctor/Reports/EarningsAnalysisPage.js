import React, { useMemo, useState } from "react";
import moment from "moment";
import {
  Card,
  ChartLegend,
  ConfirmModal,
  DonutChart,
  DonutLegend,
  KpiGrid,
  RecordFormModal,
  RecordViewModal,
  ReportShell,
  RowActions,
  StackedBarChart,
  StatusPill,
  TableEmpty,
} from "./ReportComponents";
import {
  PATIENT_NAMES,
  buildDailySeries,
  defaultRange,
  downloadCsv,
  formatDate,
  formatInr,
  formatInrShort,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
} from "./reportData";

const COLORS = ["#2563eb", "#14b8a6", "#a78bfa"];
const STATUS_TONE = { Paid: "green", Pending: "amber", Refunded: "slate" };

const TRANSACTION_FIELDS = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "patient", label: "Patient", required: true, placeholder: "Patient name" },
  { key: "type", label: "Type", type: "select", options: ["Consultation", "Medicine Order", "Follow-up", "Other"], defaultValue: "Consultation" },
  { key: "amount", label: "Amount (₹)", type: "number", required: true, min: 1 },
  { key: "mode", label: "Payment mode", type: "select", options: ["UPI", "Cash", "Card", "Online"], defaultValue: "UPI" },
  { key: "status", label: "Status", type: "select", options: ["Paid", "Pending", "Refunded"], defaultValue: "Paid" },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Optional" },
];

const SEED = [
  ["Consultation", 500, "Paid", "UPI", 3],
  ["Medicine Order", 1250, "Paid", "Online", 3],
  ["Consultation", 500, "Pending", "Cash", 4],
  ["Consultation", 700, "Paid", "Card", 5],
  ["Follow-up", 320, "Paid", "UPI", 6],
  ["Medicine Order", 860, "Refunded", "Online", 7],
  ["Consultation", 500, "Paid", "UPI", 8],
].map(([type, amount, status, mode, daysAgo], i) => ({
  id: `tx-${i + 1}`,
  date: moment().subtract(daysAgo, "days").format("YYYY-MM-DD"),
  patient: PATIENT_NAMES[i],
  type,
  amount,
  status,
  mode,
  notes: "",
  ref: `TXN${(482310 + i * 37).toString()}`,
}));

const EarningsAnalysisPage = () => {
  document.title = "Doctor Earning Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const [rows, setRows] = useState(SEED);
  const [filter, setFilter] = useState("all");
  const [formState, setFormState] = useState(null);
  const [viewState, setViewState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const key = rangeKey(range);
  const trend = useMemo(
    () => buildDailySeries(range, "earnings", { consultation: [8000, 14000], medicine: [1800, 4600], others: [300, 1200] }),
    [range]
  );
  const { consultation, medicine, others } = trend.totals;
  const total = consultation + medicine + others;
  const payoutPending = Math.round(total * 0.18);

  const breakdown = [
    { label: "Consultation", value: consultation },
    { label: "Medicine", value: medicine },
    { label: "Others", value: others },
  ];

  const visible = rows
    .filter((r) => filter === "all" || r.status.toLowerCase() === filter)
    .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());

  const openEdit = (r) =>
    setFormState({ id: r.id, title: "Edit transaction", icon: "ri-pencil-line", subject: `${r.ref} · ${r.patient}`, values: r, size: "lg" });

  const openView = (r) =>
    setViewState({
      title: "Transaction receipt",
      icon: "ri-bill-line",
      header: `${r.ref} · ${formatInr(r.amount)}`,
      rows: [
        ["Date", formatDate(r.date)],
        ["Patient", r.patient],
        ["Type", r.type],
        ["Payment mode", r.mode],
        ["Status", r.status],
        ["Amount", formatInr(r.amount)],
        ["Notes", r.notes],
      ],
      onEdit: () => {
        setViewState(null);
        openEdit(r);
      },
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
      ["Payout pending", payoutPending],
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
    >
      <KpiGrid
        items={[
          { label: "Total Earnings", value: formatInr(total), tone: "teal", icon: "ri-wallet-3-line" },
          { label: "Consultation Fees", value: formatInr(consultation), tone: "blue", icon: "ri-stethoscope-line" },
          { label: "Medicine Orders", value: formatInr(medicine), tone: "green", icon: "ri-capsule-line" },
          { label: "Payout Pending", value: formatInr(payoutPending), tone: "red", icon: "ri-bank-line", emphasis: true },
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
          <div className="d-flex align-items-center gap-2">
            <div className="drp-tabs" role="tablist">
              {["all", "paid", "pending", "refunded"].map((t) => (
                <button key={t} type="button" className={filter === t ? "is-active" : undefined} onClick={() => setFilter(t)}>
                  {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="drp-card-btn"
              onClick={() =>
                setFormState({
                  isNew: true,
                  title: "Add transaction",
                  icon: "ri-add-line",
                  size: "lg",
                  values: { date: moment().format("YYYY-MM-DD") },
                })
              }
            >
              <i className="ri-add-line" aria-hidden="true" /> Add entry
            </button>
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
                      <RowActions
                        actions={[
                          { label: "View receipt", icon: "ri-eye-line", tone: "view", onClick: () => openView(r) },
                          { label: "Edit", icon: "ri-pencil-line", tone: "edit", onClick: () => openEdit(r) },
                          {
                            label: "Delete",
                            icon: "ri-delete-bin-line",
                            tone: "delete",
                            onClick: () =>
                              setConfirmState({
                                id: r.id,
                                title: "Delete transaction",
                                subject: `${r.ref} · ${r.patient} · ${formatInr(r.amount)}`,
                                text: "This transaction will be removed from your earnings report.",
                                confirmLabel: "Delete transaction",
                              }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={6}>No transactions in this view.</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordFormModal
        state={formState}
        fields={TRANSACTION_FIELDS}
        onClose={() => setFormState(null)}
        onSubmit={(values) => {
          if (formState.isNew) {
            setRows((prev) => [{ id: `tx-${Date.now()}`, ref: `TXN${Date.now().toString().slice(-6)}`, ...values }, ...prev]);
          } else {
            setRows((prev) => prev.map((r) => (r.id === formState.id ? { ...r, ...values } : r)));
          }
          setFormState(null);
        }}
      />
      <RecordViewModal state={viewState} onClose={() => setViewState(null)} />
      <ConfirmModal
        state={confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => {
          setRows((prev) => prev.filter((r) => r.id !== confirmState.id));
          setConfirmState(null);
        }}
      />
    </ReportShell>
  );
};

export default EarningsAnalysisPage;
