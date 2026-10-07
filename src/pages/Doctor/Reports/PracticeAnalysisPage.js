import React, { useMemo, useState } from "react";
import { practiceReport } from "../../../helpers/s5Week5Api";
import { Card, ChartLegend, DonutChart, DonutLegend, KpiGrid, ReportShell, StackedBarChart, TableEmpty } from "./ReportComponents";
import {
  changePct,
  defaultRange,
  downloadCsv,
  fillDaily,
  formatCount,
  formatInr,
  initialsOf,
  pct,
  rangeKey,
  rangeLabel,
  useReportLoader,
} from "./reportData";

const TYPE_COLORS = ["#2563eb", "#14b8a6", "#60a5fa"];
const AVATAR_TONES = ["", "drp-avatar--green", "drp-avatar--purple", "drp-avatar--amber"];

const PracticeAnalysisPage = () => {
  document.title = "Doctor Practice Analysis | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const { data, loading, error, reload } = useReportLoader(practiceReport, range);

  const key = rangeKey(range);
  const trend = useMemo(() => fillDaily(range, data?.daily, ["newCount", "followUpCount"]), [range, data]);
  const totals = data?.totals || {};
  const previous = data?.previous || {};
  const total = Number(totals.consultations || 0);
  const types = (data?.types || []).map((t) => ({ label: t.name, value: Number(t.cnt || 0) }));
  const services = data?.services || [];
  const ratingAvg = data?.rating?.count ? Number(data.rating.average || 0).toFixed(1) : "—";

  const handleExport = () => {
    downloadCsv(`practice-analysis-${key}.csv`, [
      ["Doctor Practice Analysis", rangeLabel(range)],
      [],
      ["Date", "New", "Follow-up", "Total"],
      ...trend.categories.map((d, i) => [d, trend.series.newCount[i], trend.series.followUpCount[i], trend.series.newCount[i] + trend.series.followUpCount[i]]),
      [],
      ["Consultation type", "Count", "Share"],
      ...types.map((t) => [t.label, t.value, pct(t.value, total)]),
      [],
      ["Service", "Consultations", "Patients", "Revenue"],
      ...services.map((s) => [s.name, s.consultations, s.patients, s.revenue]),
    ]);
  };

  return (
    <ReportShell
      title="Practice Statistics"
      subtitle="Doctor practice analysis: consultations, patient mix and top services"
      range={range}
      onRangeChange={setRange}
      onExport={handleExport}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      <KpiGrid
        items={[
          { label: "Total Consultations", value: formatCount(total), change: changePct(total, previous.consultations), tone: "blue", icon: "ri-file-list-3-line" },
          { label: "New Patients", value: formatCount(totals.newPatients), change: changePct(totals.newPatients, previous.newPatients), tone: "green", icon: "ri-user-add-line" },
          { label: "Follow-up Patients", value: formatCount(totals.followUps), change: changePct(totals.followUps, previous.followUps), tone: "blue", icon: "ri-user-follow-line" },
          { label: `Avg. Rating${data?.rating?.count ? ` (${data.rating.count})` : ""}`, value: ratingAvg, tone: "amber", icon: "ri-star-smile-line" },
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
              { name: "New", data: trend.series.newCount },
              { name: "Follow-up", data: trend.series.followUpCount },
            ]}
          />
        </Card>
        <Card title="Consultation Type">
          <div className="drp-donut">
            <DonutChart labels={types.map((t) => t.label)} values={types.map((t) => t.value)} colors={TYPE_COLORS} totalValue={formatCount(total)} />
            <DonutLegend
              items={types.map((t, i) => ({ label: t.label, color: TYPE_COLORS[i % TYPE_COLORS.length], value: `${formatCount(t.value)} (${pct(t.value, total)})` }))}
            />
          </div>
        </Card>
      </div>

      <Card title="Top Performing Services">
        <div className="drp-table-wrap">
          <table className="drp-table">
            <colgroup>
              <col />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Service</th>
                <th>Consultations</th>
                <th>Patients</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {services.length ? (
                services.map((s, i) => (
                  <tr key={s.name}>
                    <td>
                      <span className="drp-person">
                        <span className={`drp-avatar ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>{initialsOf(s.name)}</span>
                        <span title={s.name}>{s.name}</span>
                      </span>
                    </td>
                    <td>{formatCount(s.consultations)}</td>
                    <td>{formatCount(s.patients)}</td>
                    <td className="is-strong">{formatInr(s.revenue)}</td>
                  </tr>
                ))
              ) : (
                <TableEmpty colSpan={4}>{loading ? "Loading…" : "No consultations in this period."}</TableEmpty>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </ReportShell>
  );
};

export default PracticeAnalysisPage;
