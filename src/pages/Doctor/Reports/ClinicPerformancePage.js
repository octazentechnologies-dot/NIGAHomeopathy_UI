import React, { useMemo, useState } from "react";
import moment from "moment";
import { clinicPerformance } from "../../../helpers/s5Week5Api";
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
  formatCount,
  formatInrShort,
  formatTime,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
  useReportLoader,
} from "./reportData";

const COLORS = { completed: "#3b82f6", noshow: "#f59e0b", cancelled: "#ef4444" };
const TYPE_COLORS = ["#2563eb", "#f59e0b", "#60a5fa", "#14b8a6"];
const STATUS_TONE = { "No-show": "amber", Cancelled: "red" };
const STATUS_KEY = { COMPLETED: "completed", "NOT ARRIVED": "noshow", CANCELLED: "cancelled" };

const modeLabel = (name) => {
  const v = String(name || "").toLowerCase();
  if (v === "tele") return "Video";
  if (v === "inclinic") return "In-clinic";
  if (v === "first") return "New (mode not set)";
  return name || "Unknown";
};

const peakLabel = (hour) => {
  if (hour == null) return "—";
  const start = moment({ hour });
  return `${start.format("h A")} - ${start.clone().add(1, "hour").format("h A")}`;
};

const ClinicPerformancePage = () => {
  document.title = "Clinic Performance Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const { data, loading, error, reload } = useReportLoader(clinicPerformance, range);
  const [filter, setFilter] = useState("all");
  const [viewState, setViewState] = useState(null);

  const key = rangeKey(range);

  const trend = useMemo(() => {
    const byDay = {};
    (data?.dailyStatus || []).forEach((r) => {
      const k = STATUS_KEY[String(r.status || "").toUpperCase()];
      if (!k) return;
      const date = String(r.bucket).slice(0, 10);
      byDay[date] = byDay[date] || { date, completed: 0, noshow: 0, cancelled: 0 };
      byDay[date][k] += Number(r.cnt || 0);
    });
    return fillDaily(range, Object.values(byDay), ["completed", "noshow", "cancelled"]);
  }, [range, data]);

  const statusCount = (name) =>
    (data?.statuses || []).filter((s) => String(s.name).toUpperCase() === name).reduce((s, r) => s + Number(r.cnt || 0), 0);
  const total = (data?.statuses || []).reduce((s, r) => s + Number(r.cnt || 0), 0);
  const completed = statusCount("COMPLETED");
  const noshow = statusCount("NOT ARRIVED");
  const cancelled = statusCount("CANCELLED");
  const days = Math.max(1, trend.categories.length);
  const revenue = Number(data?.paid?.amount || 0);

  const types = (data?.visits || []).map((v) => ({ label: modeLabel(v.name), value: Number(v.cnt || 0) }));

  const rows = useMemo(
    () =>
      (data?.missed || []).map((r) => ({
        id: r.patientAppId,
        patient: r.patientName || `Patient #${r.patientId ?? "—"}`,
        mobile: r.mobileNo || "",
        date: r.appointmentDate,
        time: r.appointmentTime,
        mode: r.isTele || String(r.consultMode).toLowerCase() === "tele" ? "Video" : "In-clinic",
        status: String(r.status).toUpperCase() === "CANCELLED" ? "Cancelled" : "No-show",
        reason: r.cancelReasonText || r.cancelReasonCode || (String(r.status).toUpperCase() === "CANCELLED" ? "No reason given" : "Did not arrive"),
        cancelledAt: r.cancelledAt,
      })),
    [data]
  );
  const visible = rows.filter((r) => filter === "all" || r.status.toLowerCase() === filter);

  const fmtSlot = (r) => `${moment(r.date).format("DD MMM YYYY")}${r.time ? `, ${formatTime(r.time)}` : ""}`;

  const handleExport = () => {
    downloadCsv(`clinic-performance-${key}.csv`, [
      ["Clinic Performance", rangeLabel(range)],
      [],
      ["Date", "Completed", "No-show", "Cancelled"],
      ...trend.categories.map((d, i) => [d, trend.series.completed[i], trend.series.noshow[i], trend.series.cancelled[i]]),
      [],
      ["Total appointments", total],
      ["Unique patients", data?.uniquePatients ?? 0],
      ["Peak hours", peakLabel(data?.peakHour)],
      ["Revenue collected", revenue],
      [],
      ["Patient", "Mobile", "Slot", "Type", "Status", "Reason"],
      ...rows.map((r) => [r.patient, r.mobile, fmtSlot(r), r.mode, r.status, r.reason]),
    ]);
  };

  return (
    <ReportShell
      title="Clinic Performance"
      subtitle="Appointments, attendance and clinic efficiency"
      range={range}
      onRangeChange={setRange}
      onExport={handleExport}
      loading={loading}
      error={error}
      onRetry={reload}
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
            <DonutLegend items={types.map((t, i) => ({ label: t.label, color: TYPE_COLORS[i % TYPE_COLORS.length], value: pct(t.value, total) }))} />
          </div>
        </Card>
      </div>

      <KpiGrid
        items={[
          { label: "Unique Patients", value: formatCount(data?.uniquePatients), tone: "blue", icon: "ri-group-line" },
          { label: "Avg. Appointments / Day", value: (total / days).toFixed(1), tone: "teal", icon: "ri-pie-chart-2-line" },
          { label: "Peak Hours", value: peakLabel(data?.peakHour), tone: "purple", icon: "ri-time-line" },
          { label: "Revenue Collected", value: formatInrShort(revenue), tone: "green", icon: "ri-secure-payment-line" },
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
              <col style={{ width: "22%" }} />
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
                                  ["Mobile", r.mobile],
                                  ["Type", r.mode],
                                  ["Status", r.status],
                                  ["Reason", r.reason],
                                  ["Cancelled at", r.cancelledAt ? moment(r.cancelledAt).format("DD MMM YYYY, hh:mm A") : ""],
                                ],
                              }),
                          },
                          ...(r.mobile
                            ? [{ label: "Call patient", icon: "ri-phone-line", tone: "edit", onClick: () => window.open(`tel:${r.mobile}`) }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={6}>{loading ? "Loading…" : "No missed or cancelled appointments in this view."}</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordViewModal state={viewState} onClose={() => setViewState(null)} />
    </ReportShell>
  );
};

export default ClinicPerformancePage;
