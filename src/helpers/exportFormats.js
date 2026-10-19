import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const EXPORT_FORMATS = [
  { id: "csv", label: "CSV", icon: "ri-file-text-line" },
  { id: "excel", label: "Excel", icon: "ri-file-excel-2-line" },
  { id: "pdf", label: "PDF", icon: "ri-file-pdf-2-line" },
];

const csvCell = (value) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const stamp = () => new Date().toISOString().slice(0, 10);

const safeBase = (name) =>
  String(name || "export")
    .replace(/\.(csv|xlsx|xls|pdf)$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "export";

const triggerDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Normalize rows to a matrix of display strings. columns: [{ key, label, value?(row) }] */
export const buildExportMatrix = (columns, rows) => {
  const headers = columns.map((col) => col.label || col.key);
  const body = (rows || []).map((row) =>
    columns.map((col) => {
      const raw = typeof col.value === "function" ? col.value(row) : row?.[col.key];
      if (raw == null) return "";
      return String(raw);
    })
  );
  return { headers, body };
};

export const downloadAsCsv = (fileBase, columns, rows) => {
  const { headers, body } = buildExportMatrix(columns, rows);
  const lines = [headers.map(csvCell).join(","), ...body.map((line) => line.map(csvCell).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${safeBase(fileBase)}-${stamp()}.csv`);
};

export const downloadAsExcel = (fileBase, columns, rows, sheetName = "Sheet1") => {
  const { headers, body } = buildExportMatrix(columns, rows);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, String(sheetName).slice(0, 31) || "Sheet1");
  const data = XLSX.write(book, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${safeBase(fileBase)}-${stamp()}.xlsx`);
};

export const downloadAsPdf = (fileBase, columns, rows, title = "Export") => {
  const { headers, body } = buildExportMatrix(columns, rows);
  const doc = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(12);
  doc.text(String(title || "Export"), 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 160, 226] },
  });
  doc.save(`${safeBase(fileBase)}-${stamp()}.pdf`);
};

/**
 * Download tabular data as csv | excel | pdf.
 * @param {"csv"|"excel"|"pdf"} format
 */
export const downloadExport = ({ format, fileBase, columns, rows, title, sheetName }) => {
  if (!rows?.length) {
    const err = new Error("Nothing to export.");
    err.code = "EMPTY";
    throw err;
  }
  if (!columns?.length) {
    const err = new Error("Export columns are missing.");
    err.code = "NO_COLUMNS";
    throw err;
  }
  if (format === "csv") downloadAsCsv(fileBase, columns, rows);
  else if (format === "excel") downloadAsExcel(fileBase, columns, rows, sheetName || title || "Export");
  else if (format === "pdf") downloadAsPdf(fileBase, columns, rows, title || fileBase);
  else {
    const err = new Error(`Unsupported format: ${format}`);
    err.code = "BAD_FORMAT";
    throw err;
  }
};

/** Parse a CSV string (simple, quoted fields) into { columns, rows }. */
export const matrixFromCsvText = (csvText) => {
  const text = String(csvText || "").replace(/^\uFEFF/, "").trim();
  if (!text) return { columns: [], rows: [] };
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { columns: [], rows: [] };

  const parseLine = (line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    return cells;
  };

  const headers = parseLine(lines[0]);
  const columns = headers.map((label, index) => ({
    key: `c${index}`,
    label: label || `Column ${index + 1}`,
  }));
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = {};
    columns.forEach((col, index) => {
      row[col.key] = cells[index] ?? "";
    });
    return row;
  });
  return { columns, rows };
};

/** Export from an HTML table element (skips Action columns). */
export const downloadTableElement = (table, format, fileBase = "export", title = "Export") => {
  if (!table) {
    const err = new Error("No table found to export.");
    err.code = "NO_TABLE";
    throw err;
  }
  const SKIP = new Set(["action", "actions", ""]);
  const headers = Array.from(table.querySelectorAll("thead tr:last-child th")).map((th) =>
    th.textContent.trim()
  );
  const keep = headers.map((h, i) => (SKIP.has(h.toLowerCase()) ? -1 : i)).filter((i) => i >= 0);
  const dataRows = Array.from(table.querySelectorAll("tbody tr"))
    .map((tr) => Array.from(tr.children))
    .filter((cells) => cells.length === headers.length);
  const columns = keep.map((i) => ({ key: `c${i}`, label: headers[i] }));
  const rows = dataRows.map((cells) => {
    const row = {};
    keep.forEach((i) => {
      row[`c${i}`] = cells[i]?.textContent?.replace(/\s+/g, " ").trim() || "";
    });
    return row;
  });
  downloadExport({ format, fileBase, columns, rows, title });
};
