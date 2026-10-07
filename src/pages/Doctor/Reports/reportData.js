import { useCallback, useEffect, useState } from "react";
import moment from "moment";

export const defaultRange = () => [moment().startOf("month").toDate(), moment().endOf("day").toDate()];

export const rangeDays = (range) => {
  const start = moment(range[0]).startOf("day");
  const end = moment(range[1]).startOf("day");
  const days = [];
  for (let d = start.clone(); d.isSameOrBefore(end) && days.length < 400; d.add(1, "day")) days.push(d.clone());
  return days;
};

export const rangeParams = (range) => ({
  from: moment(range[0]).format("YYYY-MM-DD"),
  to: moment(range[1]).format("YYYY-MM-DD"),
});

/**
 * Lays API daily rows (`{ date: "YYYY-MM-DD", ...keys }`) over every day in the range, filling gaps with 0.
 * Returns { categories, series: { key: number[] }, totals: { key: number } }.
 */
export const fillDaily = (range, rows, keys) => {
  const days = rangeDays(range);
  const byDate = new Map((rows || []).map((r) => [String(r.date || r.Date || r.bucket || r.Bucket).slice(0, 10), r]));
  const series = {};
  const totals = {};
  keys.forEach((key) => {
    series[key] = [];
    totals[key] = 0;
  });
  days.forEach((day) => {
    const row = byDate.get(day.format("YYYY-MM-DD")) || {};
    keys.forEach((key) => {
      const value = Number(row[key] || 0);
      series[key].push(value);
      totals[key] += value;
    });
  });
  return { categories: days.map((d) => d.format("D MMM")), series, totals, days };
};

/** Loads a report for the selected range; reloads when the range changes. */
export const useReportLoader = (loader, range) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const from = moment(range[0]).format("YYYY-MM-DD");
  const to = moment(range[1]).format("YYYY-MM-DD");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await loader({ from, to });
      setData(res || null);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Could not load this report.");
    } finally {
      setLoading(false);
    }
  }, [loader, from, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
};

export const changePct = (current, previous) => {
  const cur = Number(current || 0);
  const prev = Number(previous || 0);
  if (!prev) return undefined;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

export const sumSeries = (...arrays) =>
  arrays.reduce((acc, arr) => acc.map((v, i) => v + (arr[i] || 0)), new Array(arrays[0]?.length || 0).fill(0));

export const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

export const formatInr = (value) => `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export const formatInrShort = (value) => {
  const n = Number(value || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return formatInr(n);
};

export const pct = (part, whole, digits = 0) => (whole ? `${((part / whole) * 100).toFixed(digits)}%` : "0%");

export const formatDate = (value) => {
  const m = value ? moment(value) : null;
  return m && m.isValid() ? m.format("DD MMM YYYY") : "—";
};

export const formatTime = (value) => {
  if (!value) return "";
  const m = moment(String(value), ["HH:mm:ss", "HH:mm"]);
  return m.isValid() ? m.format("hh:mm A") : String(value);
};

export const rangeLabel = (range) => `${moment(range[0]).format("DD MMM YYYY")} - ${moment(range[1]).format("DD MMM YYYY")}`;

export const rangeKey = (range) => `${moment(range[0]).format("YYYYMMDD")}-${moment(range[1]).format("YYYYMMDD")}`;

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const initialsOf = (name) =>
  String(name || "?")
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

export const errorText = (err, fallback = "Something went wrong.") =>
  typeof err === "string" ? err : err?.message || fallback;
