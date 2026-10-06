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
  formatDate,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
} from "./reportData";

const COLORS = { completed: "#22c55e", due: "#f59e0b", overdue: "#ef4444" };
const STATUS_TONE = { Due: "amber", Overdue: "red", Completed: "green" };

const FOLLOW_UP_FIELDS = [
  { key: "nextDate", label: "Next follow-up", type: "date", required: true },
  { key: "mode", label: "Consultation mode", type: "select", options: ["In-clinic", "Video", "Chat"] },
  { key: "status", label: "Status", type: "select", options: ["Scheduled", "Completed"] },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Reason for follow-up, remedy response, etc." },
];

const SEED = PATIENT_NAMES.slice(0, 8).map((name, i) => {
  const offsets = [14, 13, 9, 13, 16, 7, 18, 5];
  const nextOffsets = [2, -1, 4, 6, -3, 1, 8, -5];
  return {
    id: `fu-${i + 1}`,
    patient: name,
    lastVisit: moment().subtract(offsets[i], "days").format("YYYY-MM-DD"),
    nextDate: moment().add(nextOffsets[i], "days").format("YYYY-MM-DD"),
    mode: ["In-clinic", "Video", "In-clinic", "Chat", "Video", "In-clinic", "Video", "In-clinic"][i],
    status: "Scheduled",
    notes: "",
  };
});

const displayStatus = (row) => {
  if (row.status === "Completed") return "Completed";
  return moment(row.nextDate).isBefore(moment(), "day") ? "Overdue" : "Due";
};

const FollowUpAnalysisPage = () => {
  document.title = "Follow-up Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const [rows, setRows] = useState(SEED);
  const [filter, setFilter] = useState("all");
  const [formState, setFormState] = useState(null);
  const [viewState, setViewState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const key = rangeKey(range);
  const trend = useMemo(
    () => buildDailySeries(range, "followup", { completed: [20, 40], due: [4, 12], overdue: [2, 8] }),
    [range]
  );
  const { completed, due, overdue } = trend.totals;
  const total = completed + due + overdue;

  const decorated = rows.map((r) => ({ ...r, display: displayStatus(r) }));
  const visible = decorated
    .filter((r) => filter === "all" || r.display.toLowerCase() === filter)
    .sort((a, b) => moment(a.nextDate).valueOf() - moment(b.nextDate).valueOf());

  const openView = (r) =>
    setViewState({
      title: "Follow-up details",
      icon: "ri-user-heart-line",
      header: r.patient,
      rows: [
        ["Last visit", formatDate(r.lastVisit)],
        ["Next follow-up", formatDate(r.nextDate)],
        ["Mode", r.mode],
        ["Status", displayStatus(r)],
        ["Notes", r.notes],
      ],
      onEdit: () => {
        setViewState(null);
        openEdit(r);
      },
    });

  const openEdit = (r) =>
    setFormState({ id: r.id, title: "Reschedule follow-up", icon: "ri-calendar-event-line", subject: r.patient, values: r });

  const handleExport = () => {
    downloadCsv(`follow-up-analysis-${key}.csv`, [
      ["Follow-up Analysis", rangeLabel(range)],
      [],
      ["Date", "Completed", "Due", "Overdue"],
      ...trend.categories.map((d, i) => [d, trend.series.completed[i], trend.series.due[i], trend.series.overdue[i]]),
      [],
      ["Patient", "Last visit", "Next follow-up", "Mode", "Status"],
      ...decorated.map((r) => [r.patient, formatDate(r.lastVisit), formatDate(r.nextDate), r.mode, r.display]),
    ]);
  };

  const donutItems = [
    { label: "Completed", value: completed, color: COLORS.completed },
    { label: "Due", value: due, color: COLORS.due },
    { label: "Overdue", value: overdue, color: COLORS.overdue },
  ];

  return (
    <ReportShell
      title="Follow-up Analysis"
      subtitle="Track follow-up completion and patients who need a reminder"
      range={range}
      onRangeChange={setRange}
      onExport={handleExport}
    >
      <KpiGrid
        items={[
          { label: "Total Follow-ups", value: formatCount(total), tone: "blue", icon: "ri-calendar-check-line" },
          { label: "Completed", value: formatCount(completed), share: pct(completed, total), tone: "green", icon: "ri-checkbox-circle-line" },
          { label: "Due", value: formatCount(due), share: pct(due, total), tone: "amber", icon: "ri-time-line" },
          { label: "Overdue", value: formatCount(overdue), share: pct(overdue, total), tone: "red", icon: "ri-alarm-warning-line" },
        ]}
      />

      <div className="drp-grid">
        <Card title="Follow-up Status Trend" actions={<ChartLegend items={donutItems} />}>
          <StackedBarChart
            categories={trend.categories}
            colors={[COLORS.completed, COLORS.due, COLORS.overdue]}
            series={[
              { name: "Completed", data: trend.series.completed },
              { name: "Due", data: trend.series.due },
              { name: "Overdue", data: trend.series.overdue },
            ]}
          />
        </Card>
        <Card title="Follow-up Conversion">
          <div className="drp-donut">
            <DonutChart
              labels={donutItems.map((d) => d.label)}
              values={donutItems.map((d) => d.value)}
              colors={donutItems.map((d) => d.color)}
              totalLabel="Completed"
              totalValue={pct(completed, total)}
            />
            <DonutLegend items={donutItems.map((d) => ({ ...d, value: pct(d.value, total) }))} />
          </div>
        </Card>
      </div>

      <Card
        title="Upcoming Follow-ups"
        actions={
          <div className="drp-tabs" role="tablist">
            {["all", "due", "overdue", "completed"].map((t) => (
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
              <col />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "112px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Last Visit</th>
                <th>Next Follow-up</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="drp-person">
                        <span className="drp-avatar">{initialsOf(r.patient)}</span>
                        <span>{r.patient}</span>
                      </span>
                    </td>
                    <td>{formatDate(r.lastVisit)}</td>
                    <td className="is-strong">{formatDate(r.nextDate)}</td>
                    <td><StatusPill tone={STATUS_TONE[r.display]}>{r.display}</StatusPill></td>
                    <td>
                      <RowActions
                        actions={[
                          { label: "View", icon: "ri-eye-line", tone: "view", onClick: () => openView(r) },
                          { label: "Reschedule", icon: "ri-pencil-line", tone: "edit", onClick: () => openEdit(r) },
                          {
                            label: "Mark completed",
                            icon: "ri-check-double-line",
                            tone: "done",
                            disabled: r.status === "Completed",
                            onClick: () => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "Completed" } : x))),
                          },
                          {
                            label: "Delete",
                            icon: "ri-delete-bin-line",
                            tone: "delete",
                            onClick: () =>
                              setConfirmState({
                                id: r.id,
                                title: "Delete follow-up",
                                subject: `${r.patient} · ${formatDate(r.nextDate)}`,
                                text: "The follow-up will be removed and the patient will not receive a reminder.",
                                confirmLabel: "Delete follow-up",
                              }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={5}>No follow-ups in this view.</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordFormModal
        state={formState}
        fields={FOLLOW_UP_FIELDS}
        onClose={() => setFormState(null)}
        onSubmit={(values) => {
          setRows((prev) => prev.map((r) => (r.id === formState.id ? { ...r, ...values } : r)));
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

export default FollowUpAnalysisPage;
