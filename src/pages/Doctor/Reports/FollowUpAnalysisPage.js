import React, { useMemo, useState } from "react";
import moment from "moment";
import Swal from "sweetalert2";
import { followUpReport, updateFollowUpTask } from "../../../helpers/s5Week5Api";
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
  defaultRange,
  downloadCsv,
  errorText,
  fillDaily,
  formatCount,
  formatDate,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
  useReportLoader,
} from "./reportData";

const COLORS = { completed: "#22c55e", due: "#f59e0b", overdue: "#ef4444" };
const STATUS_TONE = { Due: "amber", Overdue: "red", Completed: "green" };
const BUCKET_LABEL = { completed: "Completed", due: "Due", overdue: "Overdue" };

const FOLLOW_UP_FIELDS = [
  { key: "dueDate", label: "Next follow-up", type: "date", required: true, minDate: moment().format("YYYY-MM-DD") },
  { key: "title", label: "Title", full: true, placeholder: "e.g. Review remedy response" },
];

const mapRow = (r) => ({
  id: r.followUpTaskId,
  patient: r.patientName || `Patient #${r.patientId ?? "—"}`,
  mobile: r.mobileNo || "",
  title: r.title || "Follow-up",
  note: r.note || "",
  lastVisit: r.lastVisit,
  nextDate: r.dueDate,
  mode: r.mode,
  display: BUCKET_LABEL[r.bucket] || "Due",
  done: String(r.status).toUpperCase() === "DONE",
});

const FollowUpAnalysisPage = () => {
  document.title = "Follow-up Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const { data, loading, error, reload } = useReportLoader(followUpReport, range);
  const [filter, setFilter] = useState("all");
  const [formState, setFormState] = useState(null);
  const [viewState, setViewState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const key = rangeKey(range);
  const trend = useMemo(() => fillDaily(range, data?.daily, ["completed", "due", "overdue"]), [range, data]);
  const totals = data?.totals || {};
  const completed = Number(totals.completed || 0);
  const due = Number(totals.due || 0);
  const overdue = Number(totals.overdue || 0);
  const total = Number(totals.total || 0);

  const rows = useMemo(() => (data?.data || []).map(mapRow), [data]);
  const visible = rows
    .filter((r) => filter === "all" || r.display.toLowerCase() === filter)
    .sort((a, b) => moment(a.nextDate).valueOf() - moment(b.nextDate).valueOf());

  const saveTask = async (id, payload, successText) => {
    try {
      await updateFollowUpTask(id, payload);
      Swal.fire({ icon: "success", title: successText, timer: 1400, showConfirmButton: false });
      await reload();
      return true;
    } catch (err) {
      Swal.fire({ icon: "error", title: "Not saved", text: errorText(err) });
      return false;
    }
  };

  const openEdit = (r) =>
    setFormState({
      id: r.id,
      title: "Reschedule follow-up",
      icon: "ri-calendar-event-line",
      subject: r.patient,
      values: { dueDate: moment(r.nextDate).isBefore(moment(), "day") ? moment().format("YYYY-MM-DD") : moment(r.nextDate).format("YYYY-MM-DD"), title: r.title },
      submitLabel: "Reschedule",
    });

  const openView = (r) =>
    setViewState({
      title: "Follow-up details",
      icon: "ri-user-heart-line",
      header: r.patient,
      rows: [
        ["Title", r.title],
        ["Mobile", r.mobile],
        ["Last visit", formatDate(r.lastVisit)],
        ["Next follow-up", formatDate(r.nextDate)],
        ["Mode", r.mode],
        ["Status", r.display],
        ["Notes", r.note],
      ],
      onEdit: r.done
        ? undefined
        : () => {
            setViewState(null);
            openEdit(r);
          },
    });

  const handleExport = () => {
    downloadCsv(`follow-up-analysis-${key}.csv`, [
      ["Follow-up Analysis", rangeLabel(range)],
      [],
      ["Date", "Completed", "Due", "Overdue"],
      ...trend.categories.map((d, i) => [d, trend.series.completed[i], trend.series.due[i], trend.series.overdue[i]]),
      [],
      ["Patient", "Mobile", "Title", "Last visit", "Next follow-up", "Mode", "Status"],
      ...rows.map((r) => [r.patient, r.mobile, r.title, formatDate(r.lastVisit), formatDate(r.nextDate), r.mode, r.display]),
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
      loading={loading}
      error={error}
      onRetry={reload}
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
                        <span title={r.title}>{r.patient}</span>
                      </span>
                    </td>
                    <td>{formatDate(r.lastVisit)}</td>
                    <td className="is-strong">{formatDate(r.nextDate)}</td>
                    <td><StatusPill tone={STATUS_TONE[r.display]}>{r.display}</StatusPill></td>
                    <td>
                      <RowActions
                        actions={[
                          { label: "View", icon: "ri-eye-line", tone: "view", onClick: () => openView(r) },
                          { label: "Reschedule", icon: "ri-pencil-line", tone: "edit", disabled: r.done, onClick: () => openEdit(r) },
                          {
                            label: "Mark completed",
                            icon: "ri-check-double-line",
                            tone: "done",
                            disabled: r.done,
                            onClick: () => saveTask(r.id, { status: "DONE" }, "Follow-up completed"),
                          },
                          {
                            label: "Cancel follow-up",
                            icon: "ri-close-circle-line",
                            tone: "delete",
                            disabled: r.done,
                            onClick: () =>
                              setConfirmState({
                                id: r.id,
                                title: "Cancel follow-up",
                                subject: `${r.patient} · ${formatDate(r.nextDate)}`,
                                text: "The follow-up will be cancelled and the patient will not receive a reminder.",
                                confirmLabel: "Cancel follow-up",
                              }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={5}>{loading ? "Loading…" : "No follow-ups in this view."}</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordFormModal
        state={formState}
        fields={FOLLOW_UP_FIELDS}
        onClose={() => setFormState(null)}
        onSubmit={async (values) => {
          const ok = await saveTask(formState.id, { status: "OPEN", dueDate: values.dueDate, title: values.title || null }, "Follow-up rescheduled");
          if (ok) setFormState(null);
        }}
      />
      <RecordViewModal state={viewState} onClose={() => setViewState(null)} />
      <ConfirmModal
        state={confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={async () => {
          const id = confirmState.id;
          setConfirmState(null);
          await saveTask(id, { status: "CANCELLED" }, "Follow-up cancelled");
        }}
      />
    </ReportShell>
  );
};

export default FollowUpAnalysisPage;
