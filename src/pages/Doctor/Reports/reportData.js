import moment from "moment";

export const defaultRange = () => [moment().startOf("month").toDate(), moment().endOf("day").toDate()];

/** Deterministic pseudo-random generator so a given date range always renders the same sample numbers. */
export const seededRandom = (seedText) => {
  let h = 2166136261;
  const text = String(seedText);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const rangeDays = (range) => {
  const start = moment(range[0]).startOf("day");
  const end = moment(range[1]).startOf("day");
  const days = [];
  for (let d = start.clone(); d.isSameOrBefore(end) && days.length < 400; d.add(1, "day")) days.push(d.clone());
  return days;
};

/**
 * Builds one stacked daily series per key. `spec` = { key: [min, max] } per day.
 * Returns { categories, series: { key: number[] }, totals: { key: number } }.
 */
export const buildDailySeries = (range, seedKey, spec) => {
  const days = rangeDays(range);
  const series = {};
  const totals = {};
  Object.keys(spec).forEach((key) => {
    series[key] = [];
    totals[key] = 0;
  });
  days.forEach((day) => {
    const rand = seededRandom(`${seedKey}-${day.format("YYYYMMDD")}`);
    const weekend = day.day() === 0 ? 0.35 : 1;
    Object.entries(spec).forEach(([key, [min, max]]) => {
      const value = Math.round((min + rand() * (max - min)) * weekend);
      series[key].push(value);
      totals[key] += value;
    });
  });
  return { categories: days.map((d) => d.format("D MMM")), series, totals, days };
};

export const sumSeries = (...arrays) =>
  arrays.reduce((acc, arr) => acc.map((v, i) => v + (arr[i] || 0)), new Array(arrays[0]?.length || 0).fill(0));

export const changeFor = (seedKey, min = -6, max = 18) => {
  const rand = seededRandom(`change-${seedKey}`);
  return Math.round((min + rand() * (max - min)) * 10) / 10;
};

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

export const PATIENT_NAMES = [
  "Amit Sharma",
  "Neha Kulkarni",
  "Ramesh Shah",
  "Priya Sharma",
  "Sunil Desai",
  "Kavita Joshi",
  "Rohan Deshmukh",
  "Sneha Patil",
  "Meera Iyer",
  "Rahul Verma",
];

/** Spreads `count` dates across the range (or after `from`) using the seed. */
export const sampleDates = (seedKey, count, start, spanDays) => {
  const rand = seededRandom(seedKey);
  return Array.from({ length: count }, () => moment(start).add(Math.floor(rand() * spanDays), "days"));
};
