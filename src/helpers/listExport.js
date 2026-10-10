import Swal from "sweetalert2";

const SKIP_HEADERS = new Set(["action", "actions", ""]);

const csvCell = (value) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const fileNameFromTitle = () => {
  const base = String(document.title || "export")
    .split("|")[0]
    .replace(/^list\s+/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
};

/**
 * Click handler for admin list "Export" buttons: downloads the list table rendered in the
 * same card as CSV (rows currently shown, Action column excluded).
 */
export const exportListTableCsv = (event, fileName) => {
  const card = event?.currentTarget?.closest(".card") || document;
  const table = card.querySelector("table");
  if (!table) return;

  const headers = Array.from(table.querySelectorAll("thead tr:last-child th")).map((th) => th.textContent.trim());
  const keep = headers.map((h, i) => (SKIP_HEADERS.has(h.toLowerCase()) ? -1 : i)).filter((i) => i >= 0);

  const rows = Array.from(table.querySelectorAll("tbody tr"))
    .map((tr) => Array.from(tr.children))
    .filter((cells) => cells.length === headers.length);

  if (!rows.length) {
    Swal.fire({ icon: "info", title: "Nothing to export", text: "The list has no rows to export." });
    return;
  }

  const lines = [
    keep.map((i) => csvCell(headers[i])).join(","),
    ...rows.map((cells) => keep.map((i) => csvCell(cells[i].textContent)).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || fileNameFromTitle();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
