import React, { useMemo, useState } from "react";
import {
  Card,
  ChartLegend,
  ConfirmModal,
  DonutChart,
  DonutLegend,
  KpiGrid,
  RecordFormModal,
  ReportShell,
  RowActions,
  StackedBarChart,
  StatusPill,
  TableEmpty,
} from "./ReportComponents";
import {
  buildDailySeries,
  changeFor,
  defaultRange,
  downloadCsv,
  formatCount,
  formatInr,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
} from "./reportData";

const STORAGE_KEY = "niga.doctorReports.services.v1";

const SEED_SERVICES = [
  { id: "svc-1", name: "General Consultation", fee: 400, duration: 20, rating: 4.8, share: 0.375, status: "Active" },
  { id: "svc-2", name: "Follow-up Consultation", fee: 320, duration: 15, rating: 4.7, share: 0.3125, status: "Active" },
  { id: "svc-3", name: "Prescription Review", fee: 300, duration: 10, rating: 4.6, share: 0.1875, status: "Active" },
  { id: "svc-4", name: "Homeopathy Consultation", fee: 300, duration: 30, rating: 4.5, share: 0.125, status: "Active" },
];

const readServices = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(parsed) ? parsed : SEED_SERVICES;
  } catch {
    return SEED_SERVICES;
  }
};

const SERVICE_FIELDS = [
  { key: "name", label: "Service name", required: true, full: true, placeholder: "e.g. Child Consultation" },
  { key: "fee", label: "Fee (₹)", type: "number", required: true, min: 0 },
  { key: "duration", label: "Duration (mins)", type: "number", required: true, min: 5 },
  { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"], defaultValue: "Active" },
];

const TYPE_COLORS = ["#2563eb", "#60a5fa", "#14b8a6"];
const AVATAR_TONES = ["", "drp-avatar--green", "drp-avatar--purple", "drp-avatar--amber"];

const PracticeAnalysisPage = () => {
  document.title = "Doctor Practice Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const [services, setServices] = useState(readServices);
  const [formState, setFormState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const key = rangeKey(range);
  const trend = useMemo(() => buildDailySeries(range, "practice", { new: [2, 8], followup: [4, 12] }), [range]);
  const total = trend.totals.new + trend.totals.followup;

  const types = useMemo(() => {
    const video = Math.round(total * 0.56);
    const clinic = Math.round(total * 0.31);
    return [
      { label: "Video", value: video },
      { label: "In-clinic", value: clinic },
      { label: "Chat", value: Math.max(0, total - video - clinic) },
    ];
  }, [total]);

  const activeShare = services.reduce((s, svc) => s + (svc.status === "Active" ? svc.share : 0), 0) || 1;
  const serviceRows = services.map((svc) => {
    const consultations = svc.status === "Active" ? Math.round((total * svc.share) / activeShare) : 0;
    return { ...svc, consultations, revenue: consultations * svc.fee };
  });

  const saveServices = (next) => {
    setServices(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const handleSubmit = (values) => {
    if (formState.isNew) {
      saveServices([...services, { id: `svc-${Date.now()}`, rating: 0, share: 0.08, ...values }]);
    } else {
      saveServices(services.map((s) => (s.id === formState.id ? { ...s, ...values } : s)));
    }
    setFormState(null);
  };

  const handleExport = () => {
    downloadCsv(`practice-analysis-${key}.csv`, [
      ["Doctor Practice Analysis", rangeLabel(range)],
      [],
      ["Date", "New", "Follow-up", "Total"],
      ...trend.categories.map((d, i) => [d, trend.series.new[i], trend.series.followup[i], trend.series.new[i] + trend.series.followup[i]]),
      [],
      ["Consultation type", "Count", "Share"],
      ...types.map((t) => [t.label, t.value, pct(t.value, total)]),
      [],
      ["Service", "Consultations", "Revenue", "Avg rating"],
      ...serviceRows.map((s) => [s.name, s.consultations, s.revenue, s.rating || ""]),
    ]);
  };

  const ratingAvg = (() => {
    const rated = serviceRows.filter((s) => s.rating && s.consultations);
    const weight = rated.reduce((s, r) => s + r.consultations, 0);
    return weight ? (rated.reduce((s, r) => s + r.rating * r.consultations, 0) / weight).toFixed(1) : "—";
  })();

  return (
    <ReportShell
      title="Practice Statistics"
      subtitle="Doctor practice analysis: consultations, patient mix and top services"
      range={range}
      onRangeChange={setRange}
      onExport={handleExport}
    >
      <KpiGrid
        items={[
          { label: "Total Consultations", value: formatCount(total), change: changeFor(`${key}-total`), tone: "blue", icon: "ri-file-list-3-line" },
          { label: "New Patients", value: formatCount(trend.totals.new), change: changeFor(`${key}-new`), tone: "green", icon: "ri-user-add-line" },
          { label: "Follow-up Patients", value: formatCount(trend.totals.followup), change: changeFor(`${key}-fu`), tone: "blue", icon: "ri-user-follow-line" },
          { label: "Avg. Rating", value: ratingAvg, tone: "amber", icon: "ri-star-smile-line" },
        ]}
      />

      <div className="drp-grid">
        <Card
          title="Consultations Trend"
          actions={<ChartLegend items={[{ label: "New", color: "#3b82f6" }, { label: "Follow-up", color: "#14b8a6" }]} />}
        >
          <StackedBarChart
            categories={trend.categories}
            colors={["#3b82f6", "#14b8a6"]}
            series={[
              { name: "New", data: trend.series.new },
              { name: "Follow-up", data: trend.series.followup },
            ]}
          />
        </Card>
        <Card title="Consultation Type">
          <div className="drp-donut">
            <DonutChart labels={types.map((t) => t.label)} values={types.map((t) => t.value)} colors={TYPE_COLORS} totalValue={formatCount(total)} />
            <DonutLegend
              items={types.map((t, i) => ({ label: t.label, color: TYPE_COLORS[i], value: `${formatCount(t.value)} (${pct(t.value, total)})` }))}
            />
          </div>
        </Card>
      </div>

      <Card
        title="Top Performing Services"
        actions={
          <button type="button" className="drp-card-btn" onClick={() => setFormState({ isNew: true, title: "Add service", icon: "ri-add-line", values: {} })}>
            <i className="ri-add-line" aria-hidden="true" /> Add service
          </button>
        }
      >
        <div className="drp-table-wrap">
          <table className="drp-table">
            <colgroup>
              <col />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col className="drp-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Service</th>
                <th>Consultations</th>
                <th>Revenue</th>
                <th>Avg. Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {serviceRows.length ? (
                [...serviceRows]
                  .sort((a, b) => b.consultations - a.consultations)
                  .map((s, i) => (
                    <tr key={s.id}>
                      <td>
                        <span className="drp-person">
                          <span className={`drp-avatar ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>{initialsOf(s.name)}</span>
                          <span title={s.name}>{s.name}</span>
                          {s.status === "Inactive" ? <StatusPill tone="slate">Inactive</StatusPill> : null}
                        </span>
                      </td>
                      <td>{formatCount(s.consultations)}</td>
                      <td className="is-strong">{formatInr(s.revenue)}</td>
                      <td>
                        {s.rating ? (
                          <span className="drp-rating"><i className="ri-star-fill" aria-hidden="true" /> {s.rating}</span>
                        ) : "—"}
                      </td>
                      <td>
                        <RowActions
                          actions={[
                            {
                              label: "Edit service",
                              icon: "ri-pencil-line",
                              tone: "edit",
                              onClick: () => setFormState({ id: s.id, title: "Edit service", icon: "ri-pencil-line", values: s }),
                            },
                            {
                              label: "Delete service",
                              icon: "ri-delete-bin-line",
                              tone: "delete",
                              onClick: () =>
                                setConfirmState({
                                  id: s.id,
                                  title: "Delete service",
                                  subject: `${s.name} · ${formatInr(s.fee)}`,
                                  text: "This service will be removed from your practice statistics.",
                                  confirmLabel: "Delete service",
                                }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
              ) : (
                <TableEmpty colSpan={5}>No services yet. Use “Add service” to create one.</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordFormModal state={formState} fields={SERVICE_FIELDS} onClose={() => setFormState(null)} onSubmit={handleSubmit} />
      <ConfirmModal
        state={confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => {
          saveServices(services.filter((s) => s.id !== confirmState.id));
          setConfirmState(null);
        }}
      />
    </ReportShell>
  );
};

export default PracticeAnalysisPage;
