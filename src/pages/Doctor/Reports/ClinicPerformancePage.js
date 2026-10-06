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
  formatCount,
  formatInrShort,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
  seededRandom,
} from "./reportData";

const COLORS = { completed: "#3b82f6", noshow: "#f59e0b", cancelled: "#ef4444" };
const TYPE_COLORS = ["#2563eb", "#f59e0b", "#60a5fa"];
const STATUS_TONE = { "No-show": "amber", Cancelled: "red", Rescheduled: "blue" };
const AVG_FEE = 177;

const RESCHEDULE_FIELDS = [
  { key: "date", label: "New date", type: "date", required: true },
  { key: "time", label: "Time", type: "time", required: true },
  { key: "mode", label: "Appointment type", type: "select", options: ["In-clinic", "Video", "Chat"] },
  { key: "notes", label: "Notes for patient", type: "textarea", placeholder: "Optional message sent with the new slot" },
];

const REASONS = ["Patient unwell", "Travel / out of town", "Forgot appointment", "Work commitment", "Booked by mistake", "No reason given"];

const SEED = PATIENT_NAMES.slice(0, 7).map((name, i) => ({
  id: `ap-${i + 1}`,
  patient: name,
  date: moment().subtract([1, 2, 3, 4, 6, 8, 9][i], "days").format("YYYY-MM-DD"),
  time: ["10:00", "11:30", "17:15", "09:45", "12:30", "16:00", "18:30"][i],
  mode: ["In-clinic", "Video", "In-clinic", "Chat", "In-clinic", "Video", "In-clinic"][i],
  status: i % 3 === 1 ? "Cancelled" : "No-show",
  reason: REASONS[i % REASONS.length],
  notes: "",
}));

const ClinicPerformancePage = () => {
  document.title = "Clinic Performance Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const [rows, setRows] = useState(SEED);
  const [filter, setFilter] = useState("all");
  const [formState, setFormState] = useState(null);
  const [viewState, setViewState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const key = rangeKey(range);
  const trend = useMemo(
    () => buildDailySeries(range, "clinic", { completed: [100, 160], noshow: [4, 12], cancelled: [3, 11] }),
    [range]
  );
  const { completed, noshow, cancelled } = trend.totals;
  const total = completed + noshow + cancelled;

  const extras = useMemo(() => {
    const rand = seededRandom(`clinic-extra-${key}`);
    return {
      waiting: Math.round(9 + rand() * 8),
      utilisation: Math.round(70 + rand() * 18),
      peak: rand() > 0.5 ? "10 AM - 12 PM" : "5 PM - 7 PM",
    };
  }, [key]);

  const types = [
    { label: "In-clinic", value: Math.round(total * 0.6) },
    { label: "Video", value: Math.round(total * 0.3) },
  ];
  types.push({ label: "Chat", value: Math.max(0, total - types[0].value - types[1].value) });

  const visible = rows.filter((r) => filter === "all" || r.status.toLowerCase() === filter);

  const fmtSlot = (r) => `${moment(r.date).format("DD MMM YYYY")}, ${moment(r.time, "HH:mm").format("hh:mm A")}`;

  const openEdit = (r) =>
    setFormState({ id: r.id, title: "Reschedule appointment", icon: "ri-calendar-event-line", subject: r.patient, values: r, submitLabel: "Reschedule" });

  const handleExport = () => {
    downloadCsv(`clinic-performance-${key}.csv`, [
      ["Clinic Performance", rangeLabel(range)],
      [],
      ["Date", "Completed", "No-show", "Cancelled"],
      ...trend.categories.map((d, i) => [d, trend.series.completed[i], trend.series.noshow[i], trend.series.cancelled[i]]),
      [],
      ["Avg waiting time", `${extras.waiting} mins`],
      ["Clinic utilisation", `${extras.utilisation}%`],
      ["Peak hours", extras.peak],
      ["Revenue", completed * AVG_FEE],
      [],
      ["Patient", "Slot", "Type", "Status", "Reason"],
      ...rows.map((r) => [r.patient, fmtSlot(r), r.mode, r.status, r.reason]),
    ]);
  };

  return (
    <ReportShell
      title="Clinic Performance"
      subtitle="Appointments, attendance and clinic efficiency"
      range={range}
      onRangeChange={setRange}
      onExport={handleExport}
    >
      <KpiGrid
        items={[
          { label: "Total Appointments", value: formatCount(total), tone: "blue", icon: "ri-calendar-2-line" },
          { label: "Completed", value: formatCount(completed), share: pct(completed, total), tone: "green", icon: "ri-checkbox-circle-line" },
          { label: "No-shows", value: formatCount(noshow), share: pct(noshow, total), tone: "red", icon: "ri-user-unfollow-line" },
          { label: "Cancellations", value: formatCount(cancelled), share: pct(cancelled, total), tone: "red", icon: "ri-calendar-close-line" },
        ]}
      />

      <div className="drp-grid">
        <Card
          title="Appointments Trend"
          actions={
            <ChartLegend
              items={[
                { label: "Completed", color: COLORS.completed },
                { label: "No-show", color: COLORS.noshow },
                { label: "Cancelled", color: COLORS.cancelled },
              ]}
            />
          }
        >
          <StackedBarChart
            categories={trend.categories}
            colors={[COLORS.completed, COLORS.noshow, COLORS.cancelled]}
            series={[
              { name: "Completed", data: trend.series.completed },
              { name: "No-show", data: trend.series.noshow },
              { name: "Cancelled", data: trend.series.cancelled },
            ]}
          />
        </Card>
        <Card title="Appointment Type">
          <div className="drp-donut">
            <DonutChart labels={types.map((t) => t.label)} values={types.map((t) => t.value)} colors={TYPE_COLORS} totalValue={formatCount(total)} />
            <DonutLegend items={types.map((t, i) => ({ label: t.label, color: TYPE_COLORS[i], value: pct(t.value, total) }))} />
          </div>
        </Card>
      </div>

      <KpiGrid
        items={[
          { label: "Avg. Waiting Time", value: `${extras.waiting} mins`, tone: "blue", icon: "ri-timer-line" },
          { label: "Clinic Utilisation", value: `${extras.utilisation}%`, tone: "teal", icon: "ri-pie-chart-2-line" },
          { label: "Peak Hours", value: extras.peak, tone: "purple", icon: "ri-time-line" },
          { label: "Revenue", value: formatInrShort(completed * AVG_FEE), tone: "green", icon: "ri-secure-payment-line" },
        ]}
      />

      <Card
        title="Missed & Cancelled Appointments"
        actions={
          <div className="drp-tabs" role="tablist">
            {[
              ["all", "All"],
              ["no-show", "No-shows"],
              ["cancelled", "Cancelled"],
              ["rescheduled", "Rescheduled"],
            ].map(([id, label]) => (
              <button key={id} type="button" className={filter === id ? "is-active" : undefined} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="drp-table-wrap">
          <table className="drp-table">
            <colgroup>
              <col />
              <col style={{ width: "22%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "12%" }} />
              <col className="drp-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Appointment</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="drp-person">
                        <span className="drp-avatar drp-avatar--purple">{initialsOf(r.patient)}</span>
                        <span>{r.patient}</span>
                      </span>
                    </td>
                    <td>{fmtSlot(r)}</td>
                    <td>{r.mode}</td>
                    <td title={r.reason}>{r.reason}</td>
                    <td><StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill></td>
                    <td>
                      <RowActions
                        actions={[
                          {
                            label: "View",
                            icon: "ri-eye-line",
                            tone: "view",
                            onClick: () =>
                              setViewState({
                                title: "Appointment details",
                                icon: "ri-calendar-2-line",
                                header: r.patient,
                                rows: [
                                  ["Appointment", fmtSlot(r)],
                                  ["Type", r.mode],
                                  ["Status", r.status],
                                  ["Reason", r.reason],
                                  ["Notes", r.notes],
                                ],
                                onEdit: () => {
                                  setViewState(null);
                                  openEdit(r);
                                },
                              }),
                          },
                          { label: "Reschedule", icon: "ri-pencil-line", tone: "edit", onClick: () => openEdit(r) },
                          {
                            label: "Delete",
                            icon: "ri-delete-bin-line",
                            tone: "delete",
                            onClick: () =>
                              setConfirmState({
                                id: r.id,
                                title: "Delete appointment record",
                                subject: `${r.patient} · ${fmtSlot(r)}`,
                                text: "This record will be removed from the missed appointments list.",
                              }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={6}>No appointments in this view.</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordFormModal
        state={formState}
        fields={RESCHEDULE_FIELDS}
        onClose={() => setFormState(null)}
        onSubmit={(values) => {
          setRows((prev) => prev.map((r) => (r.id === formState.id ? { ...r, ...values, status: "Rescheduled" } : r)));
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

export default ClinicPerformancePage;
